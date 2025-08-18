import { Address, encodeFunctionData, erc20Abi } from 'viem'
import useAAve from './useAAve'
import { Eip1193Provider, parseUnits } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { patchFetch } from '@/utils/fecthPatch'

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

  return { getDepositCallable, getWithdrawCallable }
}

export default useVaults
