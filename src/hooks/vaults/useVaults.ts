import { Address, createPublicClient, decodeFunctionResult, encodeFunctionData, erc20Abi, http } from 'viem'
import useAAve from './useAAve'
import { AbiCoder, Eip1193Provider, parseUnits } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { patchFetch } from '@/utils/fecthPatch'
import axios from 'axios'
import { useState } from 'react'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { FeeAmount, SwapRouter } from '@uniswap/v3-sdk'
import { Pool, Route, Trade, SwapQuoter } from '@uniswap/v3-sdk'
import { CurrencyAmount, Percent, SWAP_ROUTER_02_ADDRESSES, Token, TradeType } from '@uniswap/sdk-core'
import { computePoolAddress } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { celo } from 'viem/chains'

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

  const [slippage, setSlippage] = useState<number>()
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
        return userOpHash
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

          const safe4337Pack = await initializeSafeKit()

          // Convertir string de cantidad a número para el cálculo
          const amountNumber = Number(amount)
          const rawTokenAmountIn = fromReadableAmount(amountNumber, decimals)

          // Crear provider de Ethers
          const provider = new ethers.JsonRpcProvider('https://lb.drpc.live/celo/AuajrTfUKUDcljFTxiXAxPOrBZbcQJQR8Jr2uuQ63qxe')

          const stCELO = new Token(
            42220,
            '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
            18,
            'stCELO',
            'Staked CELO'
          )

          const CELO = new Token(
            42220,
            '0x471EcE3750Da237f93B8E339c536989b8978a438',
            18,
            'CELO',
            'CELO native asset'
          )

          const currentPoolAddress = computePoolAddress({
            factoryAddress: "0xAfE208a311B21f13EF87E33A90049fC17A7acDEc",
            tokenA: stCELO,
            tokenB: CELO,
            fee: FeeAmount.LOWEST,
          })


          const poolContract = new ethers.Contract(
            currentPoolAddress,
            IUniswapV3PoolABI.abi,
            provider
          )

          // Obtener metadata de la pool
          const [token0, token1, fee, liquidity, slot0] = await Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.fee(),
            poolContract.liquidity(),
            poolContract.slot0(),
          ])


          console.debug({ token0, token1, fee, liquidity: liquidity.toString(), slot0 })

          // PASO 2: Crear instancia de Pool
          const pool = new Pool(
            stCELO,
            CELO,
            FeeAmount.LOWEST,
            slot0[0].toString(), // sqrtPriceX96
            liquidity.toString(), // liquidity
            slot0[1] // tick
          )

          // PASO 3: Crear Route
          const swapRoute = new Route(
            [pool],
            stCELO,
            CELO
          )

          const publicClient = createPublicClient({
            chain: celo,
            transport: http('https://lb.drpc.live/celo/AuajrTfUKUDcljFTxiXAxPOrBZbcQJQR8Jr2uuQ63qxe'),
          })


          // Dirección del contrato QuoterV2 en Celo
          const QUOTER_V2_CONTRACT_ADDRESS = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8' as Address


          const quoterV2Contract = new ethers.Contract(
            QUOTER_V2_CONTRACT_ADDRESS,
            Quoter.abi,
            provider
          )


          const quoteParams = {
            tokenIn: stCELO.address as Address, // stCELO
            tokenOut: CELO.address as Address, // CELO
            amountIn: BigInt(rawTokenAmountIn.toString()),
            fee: FeeAmount.LOWEST,
            sqrtPriceLimitX96: 0n,
          }
          const amountOut = (await publicClient.simulateContract({
            address: QUOTER_V2_CONTRACT_ADDRESS,
            abi: [{ "inputs": [{ "internalType": "address", "name": "_factory", "type": "address" }, { "internalType": "address", "name": "_WETH9", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "WETH9", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "factory", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }], "name": "quoteExactInput", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactInputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactInputSingle", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountOut", "type": "uint256" }], "name": "quoteExactOutput", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactOutputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactOutputSingle", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "int256", "name": "amount0Delta", "type": "int256" }, { "internalType": "int256", "name": "amount1Delta", "type": "int256" }, { "internalType": "bytes", "name": "path", "type": "bytes" }], "name": "uniswapV3SwapCallback", "outputs": [], "stateMutability": "view", "type": "function" }],
            functionName: 'quoteExactInputSingle',
            args: [quoteParams],

          })).result[0]

          const { calldata } = await SwapQuoter.quoteCallParameters(
            swapRoute,
            CurrencyAmount.fromRawAmount(
              stCELO,
              rawTokenAmountIn

            ),
            TradeType.EXACT_INPUT,
            {
              useQuoterV2: true,
            }
          )

          const callResult = await publicClient.call({
            to: QUOTER_V2_CONTRACT_ADDRESS,
            data: calldata as `0x${string}`,
          })

          const decoded = decodeFunctionResult({
            abi: [{ "inputs": [{ "internalType": "address", "name": "_factory", "type": "address" }, { "internalType": "address", "name": "_WETH9", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "WETH9", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "factory", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }], "name": "quoteExactInput", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactInputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactInputSingle", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountOut", "type": "uint256" }], "name": "quoteExactOutput", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactOutputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactOutputSingle", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "int256", "name": "amount0Delta", "type": "int256" }, { "internalType": "int256", "name": "amount1Delta", "type": "int256" }, { "internalType": "bytes", "name": "path", "type": "bytes" }], "name": "uniswapV3SwapCallback", "outputs": [], "stateMutability": "view", "type": "function" }],
            functionName: 'quoteExactInputSingle',
            data: callResult.data as `0x${string}`,
          })

          const uncheckedTrade = Trade.createUncheckedTrade({
            route: swapRoute,
            inputAmount: CurrencyAmount.fromRawAmount(
              stCELO,
              rawTokenAmountIn
            ),
            outputAmount: CurrencyAmount.fromRawAmount(
              CELO,
              JSBI.BigInt(amountOut.toString())
            ),
            tradeType: TradeType.EXACT_INPUT,
          })

          const swapOptions = {
            slippageTolerance: new Percent(50, 10_000), // 0.5% slippage
            deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutos
            recipient: safeAddress,
          }

          const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], swapOptions)


          // PASO 7: Crear transacción de aprobación
          const approveTx: MetaTransactionData = {
            to: stCELO.address as Address,
            value: '0',
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: ["0x5615CDAb10dc425a742d643d949a7F474C01abc4", BigInt(rawTokenAmountIn.toString())],
            }),
          }

          // PASO 8: Crear transacción de swap
          // const swapTx: MetaTransactionData = {
          //   data: methodParameters.calldata,
          //   to: "0x5615CDAb10dc425a742d643d949a7F474C01abc4" as Address,
          //   value: methodParameters.value,
          // }

          // PASO 9: Ejecutar ambas transacciones de forma atómica
          const identified = await safe4337Pack.createTransaction({
            transactions: [approveTx],
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
        } catch (error) {
          console.error('Error during stCELO withdraw:', error)
          throw error
        }
      },
    }
  }

  /* IMPLEMENTACIÓN ANTERIOR CON ALPHA ROUTER (comentada para referencia futura)
  const getStCeloWithdrawCallable = (decimals: number): WithdrawCallable => {
    // IMPLEMENTACIÓN CON SMART ORDER ROUTER (Comentada)
    // El router automáticamente encuentra la mejor ruta para el swap de stCELO a CELO
    // Referencia: https://docs.uniswap.org/sdk/v3/guides/swaps/routing
    // Nota: Requiere instalar @uniswap/smart-order-router
 
    // return {
    //   callContract: async (amount: string, parseAmount: boolean = true) => {
    //     // ... implementación previa
    //   }
    // }
  }
  */

  /* IMPLEMENTACIÓN ANTERIOR CON REGENERATIVE VAULT (comentada para referencia futura)
  const getStCeloWithdrawCallable = (decimals: number): WithdrawCallable => {
    const REGENERATIVE_VAULT_CONTRACT = '0xeA280B39437a64473a0C77949759E6629eD1Dc73' as Address
 
    const REGENERATIVE_VAULT_ABI = [
      {
        inputs: [
          {
            components: [
              { internalType: 'bytes32', name: 'poolId', type: 'bytes32' },
              { internalType: 'enum IVault.SwapKind', name: 'kind', type: 'uint8' },
              { internalType: 'contract IAsset', name: 'assetIn', type: 'address' },
              { internalType: 'contract IAsset', name: 'assetOut', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
              { internalType: 'bytes', name: 'userData', type: 'bytes' },
            ],
            internalType: 'struct IVault.SingleSwap',
            name: 'singleSwap',
            type: 'tuple',
          },
          {
            components: [
              { internalType: 'address', name: 'sender', type: 'address' },
              { internalType: 'bool', name: 'fromInternalBalance', type: 'bool' },
              { internalType: 'address payable', name: 'recipient', type: 'address' },
              { internalType: 'bool', name: 'toInternalBalance', type: 'bool' },
            ],
            internalType: 'struct IVault.FundManagement',
            name: 'funds',
            type: 'tuple',
          },
          { internalType: 'uint256', name: 'limit', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        name: 'swap',
        outputs: [{ internalType: 'uint256', name: 'amountCalculated', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function',
      },
    ]
 
    return {
      callContract: async (amount: string, parseAmount: boolean = true) => {
        patchFetch()
        const safe4337Pack = await initializeSafeKit()
        const parsedAmount = parseAmount ? parseUnits(amount, decimals) : amount
 
        const approveTx: MetaTransactionData = {
          to: STCELO_CONTRACT,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [REGENERATIVE_VAULT_CONTRACT, parsedAmount as bigint],
          }),
        }
 
        const slippageBps = 50
        const ONE = 10n ** 18n
        const denom = ONE + (ONE * BigInt(slippageBps)) / 10_000n
        const limit = (BigInt(parseAmount) * ONE) / denom
 
        const timespan = Math.floor(Date.now() / 1000) + 600
 
        const withdrawTx: MetaTransactionData = {
          to: REGENERATIVE_VAULT_CONTRACT,
          value: '0',
          data: encodeFunctionData({
            abi: REGENERATIVE_VAULT_ABI,
            functionName: 'swap',
            args: [
              [
                '0x1400eecf44933b1a1371792d48bf2561175763ad000000000000000000000008',
                0,
                '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
                '0x471EcE3750Da237f93B8E339c536989b8978a438',
                parsedAmount,
                '0x',
              ],
              [safeAddress, false, safeAddress, false],
              limit,
              timespan,
            ],
          }),
        }
 
        const identified = await safe4337Pack.createTransaction({ transactions: [approveTx, withdrawTx] })
        const signed = await safe4337Pack.signSafeOperation(identified)
        const userOpHash = await safe4337Pack.executeTransaction({ executable: signed })
 
        let userOperationReceipt = null
 
        const startTime = Date.now()
        const timeout = 60 * 1000
 
        while (!userOperationReceipt && Date.now() - startTime < timeout) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOpHash)
        }
        return userOpHash
      },
    }
  }
  */

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
      const provider = new ethers.JsonRpcProvider('')
      const publicClient = createPublicClient({
        chain: celo,
        transport: http('https://lb.drpc.live/celo/AuajrTfUKUDcljFTxiXAxPOrBZbcQJQR8Jr2uuQ63qxe'),
      })


      // Dirección del contrato QuoterV2 en Celo
      const QUOTER_V2_CONTRACT_ADDRESS = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8' as Address

      const stCELO = new Token(
        42220,
        '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
        18,
        'stCELO',
        'Staked CELO'
      )

      const CELO = new Token(
        42220,
        '0x471EcE3750Da237f93B8E339c536989b8978a438',
        18,
        'CELO',
        'CELO native asset'
      )

      const quoterV2Contract = new ethers.Contract(
        QUOTER_V2_CONTRACT_ADDRESS,
        Quoter.abi,
        provider
      )

      const amountNumber = Number(amount)
      const rawTokenAmountIn = fromReadableAmount(amountNumber, decimals)
      console.debug('Raw token amount in (wei):', rawTokenAmountIn.toString())

      const quoteParams = {
        tokenIn: stCELO.address as Address, // stCELO
        tokenOut: CELO.address as Address, // CELO
        amountIn: BigInt(rawTokenAmountIn.toString()),
        fee: FeeAmount.LOWEST,
        sqrtPriceLimitX96: 0n,
      }
      const quote = (await publicClient.simulateContract({
        address: QUOTER_V2_CONTRACT_ADDRESS,
        abi: [{ "inputs": [{ "internalType": "address", "name": "_factory", "type": "address" }, { "internalType": "address", "name": "_WETH9", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "WETH9", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "factory", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }], "name": "quoteExactInput", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactInputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactInputSingle", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "path", "type": "bytes" }, { "internalType": "uint256", "name": "amountOut", "type": "uint256" }], "name": "quoteExactOutput", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" }, { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct IQuoterV2.QuoteExactOutputSingleParams", "name": "params", "type": "tuple" }], "name": "quoteExactOutputSingle", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" }, { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" }, { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "int256", "name": "amount0Delta", "type": "int256" }, { "internalType": "int256", "name": "amount1Delta", "type": "int256" }, { "internalType": "bytes", "name": "path", "type": "bytes" }], "name": "uniswapV3SwapCallback", "outputs": [], "stateMutability": "view", "type": "function" }],
        functionName: 'quoteExactInputSingle',
        args: [quoteParams],

      })).result[0]

      console.debug('Quote from Uniswap QuoterV2:', quote)

      const ratio = Number(rawTokenAmountIn) / Number(quote)
      const slippagePercentage = await calculateRatioDifference(
        '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
        '0x471EcE3750Da237f93B8E339c536989b8978a438',
        ratio,
      )
      setSlippage(slippagePercentage || 0)

      const outputAmount = (Number(quote) / Math.pow(10, decimals)).toString()
      return outputAmount
    } catch (error) {
      console.error('Error obteniendo quote de Uniswap:', error)
      throw error
    }
  }

  /* IMPLEMENTACIÓN ANTERIOR CON BALANCER VAULT (comentada para referencia futura)
  const getExpectedOutputAmount = async (amount: string, decimals: number = 18): Promise<string> => {
    try {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http('https://rpc.celopg.eco'),
      })
 
      const parsedAmount = parseUnits(amount, decimals)
      const BALANCER_VAULT_CONTRACT = '0x9E49cF316C976EE0E776f09730130A900801E371' as Address
 
      const BALANCER_VAULT_ABI = [
        {
          inputs: [
            {
              components: [
                { internalType: 'bytes32', name: 'poolId', type: 'bytes32' },
                { internalType: 'enum IVault.SwapKind', name: 'kind', type: 'uint8' },
                { internalType: 'contract IAsset', name: 'assetIn', type: 'address' },
                { internalType: 'contract IAsset', name: 'assetOut', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
                { internalType: 'bytes', name: 'userData', type: 'bytes' },
              ],
              internalType: 'struct IVault.SingleSwap',
              name: 'singleSwap',
              type: 'tuple',
            },
            {
              components: [
                { internalType: 'address', name: 'sender', type: 'address' },
                { internalType: 'bool', name: 'fromInternalBalance', type: 'bool' },
                { internalType: 'address payable', name: 'recipient', type: 'address' },
                { internalType: 'bool', name: 'toInternalBalance', type: 'bool' },
              ],
              internalType: 'struct IVault.FundManagement',
              name: 'funds',
              type: 'tuple',
            },
          ],
          name: 'querySwap',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const
 
      // Consultar el output exacto usando querySwap
      const result = await publicClient.readContract({
        address: BALANCER_VAULT_CONTRACT,
        abi: BALANCER_VAULT_ABI,
        functionName: 'querySwap',
        args: [
          {
            poolId: '0xa14d533365c510319dc886ff5c3dd5fe5f1141f5000200000000000000000015',
            kind: 0, // GIVEN_IN
            assetIn: '0x471EcE3750Da237f93B8E339c536989b8978a438', // stCELO
            assetOut: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24', // CELO
            amount: parsedAmount,
            userData: '0x',
          },
          {
            sender: safeAddress as Address,
            fromInternalBalance: false,
            recipient: safeAddress as Address,
            toInternalBalance: false,
          },
        ],
      })
 
      const ratio = Number(parsedAmount) / Number(result)
      const slippage = await calculateRatioDifference(
        '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
        '0x471EcE3750Da237f93B8E339c536989b8978a438',
        ratio,
      )
      setSlippage(slippage || 0)
 
      // Convertir el resultado de wei a formato decimal
      const outputAmount = (Number(result) / Math.pow(10, decimals)).toString()
      return outputAmount
    } catch (error) {
      console.error('Error consultando swap output:', error)
      throw error
    }
  }
  */

  const priceCache: Record<string, number> = {}

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
