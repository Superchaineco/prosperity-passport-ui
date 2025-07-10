import { CHAIN_ID } from '@/features/superChain/constants'
import useWallet from '@/hooks/wallets/useWallet'
import useReactiveChainId from '@/hooks/wallets/useReactiveChainId'
import useChainId from '@/hooks/useChainId'

const useIsWrongChain = (dynamically = false): boolean => {
  const wallet = useWallet()
  const chainId = dynamically ? useReactiveChainId() : useChainId()

  if (!wallet || !chainId) return false

  return wallet.chainId !== CHAIN_ID
}

export default useIsWrongChain
