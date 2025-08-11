import { Address, encodeFunctionData } from 'viem'
import useAAve from './useAAve'
import { Eip1193Provider, parseUnits } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'

export type VaultStrategy = 'aave' | 'stcelo' | string

type DepositCallable = {
    callContract: (amount: string) => Promise<string>
}

type WithdrawCallable = {
    // parseAmount param es utilizado por Aave/stCELO para distinguir raw_amount en withdraw all
    callContract: (amount: string, parseAmount?: boolean) => Promise<string>
}

const STCELO_VAULT_CONTRACT = '0x0239b96D10a434a56CC9E09383077A0490cF9398' as Address
const STCELO_ABI = [
    { inputs: [], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
    { inputs: [{ internalType: 'uint256', name: 'stCeloAmount', type: 'uint256' }], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
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
            onchainAnalytics: { platform: 'Web', project: 'SuperAccounts' },
            safeModulesVersion: '0.3.0',
        })
    }

    const getStCeloDepositCallable = (decimals: number): DepositCallable => {
        return {
            callContract: async (amount: string) => {
                const safe4337Pack = await initializeSafeKit()
                const valueWei = parseUnits(amount, decimals ?? 18)

                const depositTx: MetaTransactionData = {
                    to: STCELO_VAULT_CONTRACT,
                    value: valueWei.toString(),
                    data: encodeFunctionData({ abi: STCELO_ABI, functionName: 'deposit', args: [] }),
                }

                const identified = await safe4337Pack.createTransaction({ transactions: [depositTx] })
                const signed = await safe4337Pack.signSafeOperation(identified)
                const userOpHash = await safe4337Pack.executeTransaction({ executable: signed })
                return userOpHash
            },
        }
    }

    const getStCeloWithdrawCallable = (decimals: number): WithdrawCallable => {
        return {
            callContract: async (amount: string, parseAmount: boolean = true) => {
                const safe4337Pack = await initializeSafeKit()
                const parsedAmount = parseAmount ? parseUnits(amount, decimals ?? 18) : amount

                const withdrawTx: MetaTransactionData = {
                    to: STCELO_VAULT_CONTRACT,
                    value: '0',
                    data: encodeFunctionData({
                        abi: STCELO_ABI,
                        functionName: 'withdraw',
                        args: [parsedAmount as unknown as bigint],
                    }),
                }

                const identified = await safe4337Pack.createTransaction({ transactions: [withdrawTx] })
                const signed = await safe4337Pack.signSafeOperation(identified)
                const userOpHash = await safe4337Pack.executeTransaction({ executable: signed })
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

    const getWithdrawCallable = (
        strategy: VaultStrategy,
        supplyToken: Address,
        decimals: number,
    ): WithdrawCallable => {
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
