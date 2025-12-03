import { Address, encodeFunctionData, erc20Abi } from 'viem'
import useAAve from './useAAve'
import { Eip1193Provider, parseUnits } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { patchFetch } from '@/utils/fecthPatch'
import axios from 'axios'
import { useState, useEffect } from 'react'
import JSBI from 'jsbi'
import useSuperChainAccount from '../super-chain/useSuperChainAccount'
import { QuoteRequest, RoutesRequest } from '@lifi/types'

export type VaultStrategy = 'aave' | 'stcelo' | string

type DepositCallable = {
  callContract: (amount: string) => Promise<string>
}

type WithdrawCallable = {
  // parseAmount param es utilizado por Aave/stCELO para distinguir raw_amount en withdraw all
  callContract: (amount: string, parseAmount?: boolean) => Promise<string>
}

const STCELO_VAULT_CONTRACT = '0x0239b96D10a434a56CC9E09383077A0490cF9398' as Address
const STCELO_CONTRACT = '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24' as Address
const CELOPG_VALIDATOR_GROUP = '0x6F769BcC21A867b839b6cA59dDe6c6C90c1DF18D' as Address
const STCELO_VAULT_ABI = [
  { inputs: [], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
  {
    inputs: [{ internalType: 'uint256', name: 'stCeloAmount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newStrategy', type: 'address' }],
    name: 'changeStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

function useVaults() {
  const { getAAveDepositCallable, getAAveWithdrawCallable } = useAAve()
  const wallet = useWallet()
  const safeAddress = useSafeAddress()
  const { publicClient } = useSuperChainAccount()

  const [slippage, setSlippage] = useState<number>()

  useEffect(() => {
    let isMounted = true

    const initializeLiFi = async () => {
      try {
        const { createConfig, ChainId } = await import('@lifi/sdk')
        if (isMounted) {
          createConfig({
            integrator: "ProsperityPassport",
            rpcUrls: {
              [ChainId.CEL]: ["https://rpc.celopg.eco"]
            },
          })
        }
      } catch (err) {
        console.error('Error initializing Li.Fi:', err)
      }
    }

    initializeLiFi()

    return () => {
      isMounted = false
    }
  }, [])

  const initializeSafeKit = async (): Promise<Safe4337Pack> => {
    return await Safe4337Pack.init({
      provider: wallet?.provider as Eip1193Provider,
      signer: wallet?.address,
      bundlerUrl: `${BACKEND_BASE_URI}/user-op-reverse-proxy`,
      paymasterOptions: {
        isSponsored: true,
        paymasterUrl: `${BACKEND_BASE_URI}/user-op-reverse-proxy`,
      },
      options: {
        safeAddress,
      },
      onchainAnalytics: { platform: 'Web', project: 'ProsperityAccounts' },
      safeModulesVersion: '0.3.0',
    })
  }



  const getStCeloDepositCallable = (decimals: number): DepositCallable => {
    return {
      callContract: async (amount: string) => {
        const valueWei = parseUnits(amount, decimals ?? 18)

        const depositTx: MetaTransactionData = {
          to: STCELO_VAULT_CONTRACT,
          value: valueWei.toString(),
          data: encodeFunctionData({ abi: STCELO_VAULT_ABI, functionName: 'deposit', args: [] }),
        }

        const changeStrategyTx: MetaTransactionData = {
          to: STCELO_VAULT_CONTRACT,
          value: '0',
          data: encodeFunctionData({
            abi: STCELO_VAULT_ABI,
            functionName: 'changeStrategy',
            args: [CELOPG_VALIDATOR_GROUP],
          }),
        }

        patchFetch()
        const safe4337Pack = await initializeSafeKit()

        const identified = await safe4337Pack.createTransaction({
          transactions: [depositTx, changeStrategyTx],
          options: {},
        })
        const signed = await safe4337Pack.signSafeOperation(identified)
        const userOpHash = await safe4337Pack.executeTransaction({ executable: signed })

        let userOperationReceipt = null

        const startTime = Date.now()
        const timeout = 60 * 1000 // 1 minuto

        while (!userOperationReceipt && Date.now() - startTime < timeout) {
          // Wait 2 seconds before checking the status again
          await new Promise((resolve) => setTimeout(resolve, 2000))
          userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOpHash)
        }

        console.debug({ userOperationReceipt })
        return userOperationReceipt?.userOpHash || userOpHash
      },
    }
  }

  // Función auxiliar para convertir cantidad legible a unidades mínimas del token
  // Basada en: https://docs.uniswap.org/sdk/v3/guides/swaps/routing
  const fromReadableAmount = (amount: number, decimals: number): JSBI => {
    const extraDigits = Math.pow(10, countDecimals(amount))
    const adjustedAmount = amount * extraDigits
    return JSBI.divide(
      JSBI.multiply(
        JSBI.BigInt(adjustedAmount),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
      ),
      JSBI.BigInt(extraDigits)
    )
  }

  const countDecimals = (x: number): number => {
    if (Math.floor(x.valueOf()) === x.valueOf()) return 0
    return x.toString().split('.')[1].length || 0
  }

  const getStCeloWithdrawCallable = (decimals: number): WithdrawCallable => {
    // NUEVA IMPLEMENTACIÓN: Usando Uniswap V3 SDK con una Pool simple
    // Referencia: https://docs.uniswap.org/sdk/v3/guides/swaps/executing-a-trade

    return {
      callContract: async (amount: string, parseAmount: boolean = true) => {
        patchFetch()
        try {

          const { ChainId, getQuote, convertQuoteToRoute, getStepTransaction } = await import('@lifi/sdk')

          const safe4337Pack = await initializeSafeKit()

          // Convertir string de cantidad a número para el cálculo
          const amountNumber = Number(amount)
          const rawTokenAmountIn = fromReadableAmount(amountNumber, decimals)


          const quoteRequest: QuoteRequest = {
            fromChain: ChainId.CEL,
            toChain: ChainId.CEL,
            fromToken: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
            toToken: '0x471EcE3750Da237f93B8E339c536989b8978a438',
            fromAmount: rawTokenAmountIn.toString(),
            fromAddress: safeAddress,
          };

          const quote = await getQuote(quoteRequest);

          console.debug({ quote })
          const route = convertQuoteToRoute(quote)

          const approveTx: MetaTransactionData = {
            to: STCELO_CONTRACT as Address,
            value: '0',
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [route.steps[0].transactionRequest?.to as Address, BigInt(rawTokenAmountIn.toString())],
            }),
          }

          const transactions = [approveTx]

          console.debug({ route })
          for (const _step of route.steps) {
            // Request transaction data for the current step
            const step = await getStepTransaction(_step);

            const tx: MetaTransactionData = {
              to: step.transactionRequest?.to as Address,
              value: step.transactionRequest?.value?.toString() || '0',
              data: step.transactionRequest?.data as `0x${string}`,
            }

            transactions.push(tx)

          }
          console.debug({ transactions })

          const identified = await safe4337Pack.createTransaction({
            transactions,
          })

          const signed = await safe4337Pack.signSafeOperation(identified)
          const userOpHash = await safe4337Pack.executeTransaction({ executable: signed })

          // Esperar confirmación
          let userOperationReceipt = null
          const startTime = Date.now()
          const timeout = 60 * 1000

          while (!userOperationReceipt && Date.now() - startTime < timeout) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOpHash)
          }
          return userOpHash

          console.log('All steps executed successfully');
          throw new Error('stCELO withdraw via Uniswap V3 SDK is under development.')

        } catch (error) {
          console.error('Error during stCELO withdraw:', error)
          throw error
        }
      },
    }
  }

  const getDepositCallable = (strategy: VaultStrategy, supplyToken: Address, decimals: number): DepositCallable => {
    const normalized = (strategy || '').toString().toLowerCase()
    switch (normalized) {
      case 'aave':
        return getAAveDepositCallable(supplyToken, decimals)
      case 'stcelo':
        return getStCeloDepositCallable(decimals)
      default:
        return getAAveDepositCallable(supplyToken, decimals)
    }
  }

  const getWithdrawCallable = (strategy: VaultStrategy, supplyToken: Address, decimals: number): WithdrawCallable => {
    const normalized = (strategy || '').toString().toLowerCase()
    switch (normalized) {
      case 'aave':
        return getAAveWithdrawCallable(supplyToken, decimals)
      case 'stcelo':
        return getStCeloWithdrawCallable(decimals)
      default:
        return getAAveWithdrawCallable(supplyToken, decimals)
    }
  }

  /**
   * Obtiene el output esperado del swap usando Uniswap QuoterV2
   * Referencia: https://docs.uniswap.org/sdk/v3/guides/swaps/getting-a-quote
   * @param amount - Cantidad de stCELO a convertir (en formato string)
   * @param decimals - Decimales del token (normalmente 18)
   * @returns Promise con la cantidad exacta de CELO que se recibirá
   */
  const getExpectedOutputAmount = async (amount: string, decimals: number = 18): Promise<string> => {
    try {
      const rawTokenAmountIn = parseUnits(amount, decimals)

      const { ChainId, getRoutes } = await import('@lifi/sdk')


      const routesRequest: RoutesRequest = {
        fromChainId: ChainId.CEL,
        toChainId: ChainId.CEL,
        fromTokenAddress: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
        toTokenAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        fromAmount: rawTokenAmountIn.toString(),
      };


      const result = await getRoutes(routesRequest);
      const routes = result.routes;


      const quote = routes[0].toAmount;

      const ratio = Number(rawTokenAmountIn) / Number(quote)

      const expectedOut = await publicClient.readContract({
        abi: [{
          inputs: [
            {
              internalType: 'uint256',
              name: 'stCeloAmount',
              type: 'uint256',
            },
          ],
          name: 'toCelo',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }],
        address: '0x0239b96D10a434a56CC9E09383077A0490cF9398',
        functionName: 'toCelo',
        args: [rawTokenAmountIn],
      })

      const expectedRatio = Number(rawTokenAmountIn) / Number(expectedOut)

      const slippagePercentage = Math.abs((expectedRatio - ratio) / expectedRatio) * 100

      setSlippage(slippagePercentage || 0)

      const outputAmount = (Number(quote) / Math.pow(10, decimals)).toString()
      return outputAmount
    } catch (error) {
      console.error('Error obteniendo quote de Uniswap:', error)
      throw error
    }
  }


  async function calculateRatioDifference(
    tokenA: string,
    tokenB: string,
    providedRatio: number,
  ): Promise<number | null> {
    try {
      const fetchPrices = async (tokens: string[]): Promise<Record<string, number>> => {
        const response = await axios.get(`${BACKEND_BASE_URI}/assets/${tokens.join(',')}/prices`)
        return response.data // Se espera que el backend devuelva un objeto con los precios
      }

      const prices = await fetchPrices([tokenA, tokenB])
      const priceA = prices[tokenA] || 0
      const priceB = prices[tokenB] || 0

      console.debug(`Prices fetched - ${tokenA}:`, priceA, `${tokenB}:`, priceB)

      if (priceA > 0 && priceB > 0) {
        const marketRatio = priceA / priceB

        console.debug(`Market ratio for ${tokenA} and ${tokenB}:`, marketRatio, providedRatio)

        return (Math.abs(providedRatio - marketRatio) / marketRatio) * 100
      }

      return null
    } catch (error) {
      console.error(`Error calculating ratio difference for ${tokenA} and ${tokenB}:`, error)
      return null
    }
  }

  return {
    getDepositCallable,
    getWithdrawCallable,
    getExpectedOutputAmount,
    calculateRatioDifference,
    slippage,
  }
}

export default useVaults
