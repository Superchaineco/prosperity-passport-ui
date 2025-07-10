import { CHAIN_ID } from '@/features/superChain/constants'
import useWallet from '@/hooks/wallets/useWallet'
import useReactiveChainId from '@/hooks/wallets/useReactiveChainId'
import useChainId from '@/hooks/useChainId'

const useIsWrongChain = (dynamically = false): boolean => {
  const wallet = useWallet()
  const reactiveChainId = useReactiveChainId()
  const staticChainId = useChainId()
  const chainId = dynamically ? reactiveChainId : staticChainId


  if (!wallet || !chainId) return false

  return wallet.chainId !== CHAIN_ID
}

export default useIsWrongChain
