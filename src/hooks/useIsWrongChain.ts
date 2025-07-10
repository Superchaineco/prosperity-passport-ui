import { CHAIN_ID } from '@/features/superChain/constants'
import useReactiveChainId from '@/hooks/wallets/useReactiveChainId'
import useWallet from '@/hooks/wallets/useWallet'

const useIsWrongChain = (): boolean => {
  const reactiveChainId = useReactiveChainId()
  const wallet = useWallet()

  return !!wallet && reactiveChainId !== CHAIN_ID
}

export default useIsWrongChain
