import type { SuperChainAccount } from '@/types/super-chain'
import type { AsyncResult } from '../useAsync'
import useSuperChainAccount from '../super-chain/useSuperChainAccount'
import useSafeInfo from '../useSafeInfo'
import { useQuery } from '@tanstack/react-query'
import { getWeeklyRelayedTransactions } from '@/services/superchain-accounts/sponsor'
import type { Address } from 'viem'

export const useLoadSuperChainAccount = (): AsyncResult<SuperChainAccount> => {
  const { safe } = useSafeInfo()
  const { address } = safe
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
  const { data, isLoading, error } = useQuery<SuperChainAccount>({
    queryKey: ['superChainAccount', address.value],
    queryFn: async () => {
      const superChainSAresponse = await SuperChainAccountContractReadOnly.getSuperChainAccount(address.value)
      const weeklyRelayedTransactionsResponse = await getWeeklyRelayedTransactions(address.value as Address)
      let pointsToNextLevel = null
      try {
        const pointsToNextLevelResponse = await SuperChainAccountContractReadOnly.getNextLevelPoints(address.value)
        pointsToNextLevel = pointsToNextLevelResponse
      } catch (e) {
        console.error(e)
      }
      return {
        smartAccount: superChainSAresponse[0],
        superChainID: superChainSAresponse[1],
        points: superChainSAresponse[2],
        level: superChainSAresponse[3],
        noun: superChainSAresponse[4],
        pointsToNextLevel,
        weeklyRelayedTransactions: weeklyRelayedTransactionsResponse.data,
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })
  return [data, error!, isLoading]
}
