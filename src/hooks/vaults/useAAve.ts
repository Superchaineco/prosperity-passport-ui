import { Eip1193Provider, parseUnits } from 'ethers'
import { type Address, encodeFunctionData, erc20Abi } from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { AAVE_ABI } from '@/features/superChain/constants'

function useAAve() {
  const wallet = useWallet()
  const safeAddress = useSafeAddress()
  const AavePoolProvider = '0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402'

  const getAAveDepositCallable = (supplyToken: Address, decimals: number) => {
    return getDepositOnAAveCallable(supplyToken, AavePoolProvider, decimals)
  }

  const getAAveWithdrawCallable = (supplyToken: Address, decimals: number) => {
    return getWithdrawOnAAveCallable(supplyToken, AavePoolProvider, decimals)
  }

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
      onchainAnalytics: {
        platform: 'Web',
        project: 'SuperAccounts',
      },
      safeModulesVersion: '0.3.0',
    })
  }
  const getDepositOnAAveCallable = (supplyToken: Address, contract: Address, decimals: number) => {
    return {
      callContract: async (amount: string) => {
        console.debug({ amount, decimals })
        const parsedAmount = parseUnits(amount, decimals)

        const approveTx: MetaTransactionData = {
          to: supplyToken,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [contract as Address, parsedAmount],
          }),
        }

        const supplyTx: MetaTransactionData = {
          to: contract,
          value: '0',
          data: encodeFunctionData({
            abi: AAVE_ABI,
            functionName: 'supply',
            args: [supplyToken, parsedAmount, safeAddress, 0],
          }),
        }

        const safe4337Pack = await initializeSafeKit()

        const identifiedSafeOperation = await safe4337Pack.createTransaction({
          transactions: [approveTx, supplyTx],
        })

        const signedSafeOperation = await safe4337Pack.signSafeOperation(identifiedSafeOperation)
        const userOpHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        })

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

  const getWithdrawOnAAveCallable = (supplyToken: Address, contract: Address, decimals: number) => {
    return {
      callContract: async (amount: string, parseAmount: boolean = true) => {
        const safe4337Pack = await initializeSafeKit()

        const parsedAmount = parseAmount ? parseUnits(amount, decimals) : amount

        const withdrawTx: MetaTransactionData = {
          to: contract,
          value: '0',
          data: encodeFunctionData({
            abi: AAVE_ABI,
            functionName: 'withdraw',
            args: [supplyToken as Address, parsedAmount, safeAddress],
          }),
        }
        const identifiedSafeOperation = await safe4337Pack.createTransaction({
          transactions: [withdrawTx],
        })

        const signedSafeOperation = await safe4337Pack.signSafeOperation(identifiedSafeOperation)
        const userOpHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        })

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

  return {
    getAAveDepositCallable,
    getAAveWithdrawCallable,
  }
}

export default useAAve
