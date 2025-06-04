import { Eip1193Provider, MaxUint256, parseUnits } from 'ethers'
import { type Address, encodeFunctionData } from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import useWallet from '../wallets/useWallet'
import useSafeAddress from '../useSafeAddress'
import { COMPOUND_ABI } from '@/features/superChain/constants'
import { patchFetch } from '@/utils/fecthPatch'

function useCompound() {
  const wallet = useWallet()
  const safeAddress = useSafeAddress()

  const getCompoundDepositCallable = (contract: Address, supplyToken: Address) => {
    return getDepositOnCompoundCallable(contract, supplyToken)
  }

  const getCompoundWithdrawCallable = (contract: Address, supplyToken: Address) => {
    return getWithdrawOnCompoundCallable(contract, supplyToken)
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
  const getDepositOnCompoundCallable = (supplyToken: Address, contract: Address) => {
    return {
      callContract: async (amount: string) => {
        patchFetch()

        //TODO improve
        const bigIntAmount =
          supplyToken == '0x01f32b1c2345538c0c6f582fcb022739c4a194ebb' ? parseUnits(amount, 18) : parseUnits(amount, 6)

        const approveTx: MetaTransactionData = {
          to: supplyToken,
          value: '0',
          data: encodeFunctionData({
            abi: COMPOUND_ABI,
            functionName: 'approve',
            args: [contract as Address, MaxUint256],
          }),
        }

        const supplyTx: MetaTransactionData = {
          to: contract,
          value: '0',
          data: encodeFunctionData({
            abi: COMPOUND_ABI,
            functionName: 'supply',
            args: [supplyToken, bigIntAmount],
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

  const getWithdrawOnCompoundCallable = (supplyToken: Address, contract: Address) => {
    return {
      callContract: async (amount: string) => {
        patchFetch()

        const safe4337Pack = await initializeSafeKit()

        //TODO improve
        const bigIntAmount =
          supplyToken == '0x01f32b1c2345538c0c6f582fcb022739c4a194ebb' ? parseUnits(amount, 18) : parseUnits(amount, 6)

        const withdrawTx: MetaTransactionData = {
          to: contract,
          value: '0',
          data: encodeFunctionData({
            abi: COMPOUND_ABI,
            functionName: 'withdraw',
            args: [supplyToken as Address, bigIntAmount],
          }),
        }
        console.log(withdrawTx)
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
    getCompoundDepositCallable,
    getCompoundWithdrawCallable,
  }
}

export default useCompound
