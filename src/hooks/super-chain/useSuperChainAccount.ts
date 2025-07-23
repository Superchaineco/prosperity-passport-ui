import {
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_MODULE_ABI,
} from '@/features/superChain/constants'
import { Contract, Eip1193Provider, JsonRpcProvider } from 'ethers'
import { type Address, createPublicClient, createWalletClient, custom, getContract, http } from 'viem'
import usePimlico from '../usePimlico'
import { celo } from 'viem/chains'
import useWallet from '../wallets/useWallet'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { BACKEND_BASE_URI } from '@/config/constants'
import { ConnectedWallet } from '../wallets/useOnboard'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { patchFetch } from '@/utils/fecthPatch'

function useSuperChainAccount() {
  const { smartAccountClient } = usePimlico()
  const wallet = useWallet()

  const getReadOnlySuperChainSmartAccount = () => {
    const SuperChainAccountContractReadOnly = new Contract(
      SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      SUPER_CHAIN_MODULE_ABI,
      new JsonRpcProvider(JSON_RPC_PROVIDER),
    )
    return SuperChainAccountContractReadOnly
  }

  const getSponsoredCallableSuperChainSmartAccount = () => {
    return {
      callContract: async (wallet: ConnectedWallet, safeAddres: string, txData: `0x${string}`) => {
        patchFetch()
        const safe4337Pack = await Safe4337Pack.init({
          provider: wallet.provider as Eip1193Provider,
          signer: wallet.address,
          bundlerUrl: `${BACKEND_BASE_URI}/user-op-reverse-proxy`,
          paymasterOptions: {
            isSponsored: true,
            paymasterUrl: `${BACKEND_BASE_URI}/user-op-reverse-proxy`,
          },
          options: {
            safeAddress: safeAddres,
          },
          onchainAnalytics: {
            platform: 'Web',
            project: 'ProsperityAccounts',
          },
          safeModulesVersion: '0.3.0',
          // ...
        })
        console.debug('safe4337Pack', safe4337Pack)

        const safeTransactionData: MetaTransactionData = {
          to: SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
          value: '0',
          data: txData,
        }

        const identifiedSafeOperation = await safe4337Pack.createTransaction({
          transactions: [safeTransactionData],
        })
        console.debug('identifiedSafeOperation', identifiedSafeOperation)
        const signedSafeOperation = await safe4337Pack.signSafeOperation(identifiedSafeOperation)
        const userOperationHash = await safe4337Pack.executeTransaction({
          executable: signedSafeOperation,
        })
        console.debug('userOperationHash', userOperationHash)

        return userOperationHash
      },
    }
  }

  const getWriteableSuperChainSmartAccount = () => {
    if (!wallet) return
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(wallet.provider),
      account: wallet.address as Address,
    })
    const SuperChainAccountContractWriteable = getContract({
      address: SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      abi: SUPER_CHAIN_MODULE_ABI,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    })
    return SuperChainAccountContractWriteable
  }
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  })
  return {
    getReadOnlySuperChainSmartAccount,
    // getSponsoredWriteableSuperChainSmartAccount,
    getSponsoredCallableSuperChainSmartAccount,
    getWriteableSuperChainSmartAccount,
    publicClient,
  }
}

export default useSuperChainAccount
