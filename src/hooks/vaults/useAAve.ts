import { Eip1193Provider, MaxUint256, parseUnits } from 'ethers'
import { type Address, encodeFunctionData, erc20Abi } from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { AAVE_ABI } from '@/features/superChain/constants'
import { patchFetch } from '@/utils/fecthPatch'

function useAAve() {
  const wallet = useWallet()
  const safeAddress = useSafeAddress()
  const AavePoolProvider = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402"

  const getAAveDepositCallable = (supplyToken: Address) => {
    return getDepositOnAAveCallable(supplyToken, AavePoolProvider)
  }

  const getAAveWithdrawCallable = (supplyToken: Address) => {
    return getWithdrawOnAAveCallable(supplyToken, AavePoolProvider)
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
  const getDepositOnAAveCallable = (supplyToken: Address, contract: Address) => {
    return {
      callContract: async (amount: string) => {
        patchFetch()

        //TODO improve
        const parsedAmount = parseUnits(amount, 18)

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
        const userOperationHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        })

        return userOperationHash
      },
    }
  }

  const getWithdrawOnAAveCallable = (supplyToken: Address, contract: Address) => {
    return {
      callContract: async (amount: string) => {
        patchFetch()

        const safe4337Pack = await initializeSafeKit()

        //TODO improve
        const parsedAmount = parseUnits(amount, 18)

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
        const userOperationHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        })

        return userOperationHash
      },
    }
  }

  return {
    getAAveDepositCallable,
    getAAveWithdrawCallable,
  }
}

export default useAAve
