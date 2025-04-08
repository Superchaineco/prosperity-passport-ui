import { Divider, Skeleton, Stack } from '@mui/material'
import React, { useCallback, useState } from 'react'
import RankingProfile from './RankingProfile/index'
import { useLeaderboard } from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { Address } from 'viem'
import { useUserRank } from '@/hooks/super-chain/useUserRank'
import InfiniteScroll from '../common/InfiniteScroll'

function Leaderboard({ handleUserSelect }: { handleUserSelect: (address: string, rank: number) => void }) {
  const address = useSafeAddress()
  const [isFetching, setIsFetching] = useState(false)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { data, loading, fetchMore } = useLeaderboard(address as Address, 0)
  const {
    rank,
    error,
    loading: rankLoading,
  } = useUserRank(address as Address, loading, loading ? '0' : data?.superChainSmartAccount.points)

  const handleLoadMore = useCallback(async () => {
    if (isFetching || loading || !hasMore) return
    setIsFetching(true)

    const newSkip = skip + 20
    setSkip(newSkip)

    const { data: fetchMoreData } = await fetchMore({
      variables: {
        skip: newSkip,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult || !fetchMoreResult.superChainSmartAccounts.length) {
          return previousResult
        }
        setIsFetching(false)

        return {
          ...fetchMoreResult,
          superChainSmartAccounts: [
            ...previousResult.superChainSmartAccounts,
            ...fetchMoreResult.superChainSmartAccounts,
          ],
        }
      },
    })
    if (!fetchMoreData || !fetchMoreData.superChainSmartAccounts.length) {
      setHasMore(false)
    }
  }, [isFetching, loading, hasMore, skip, fetchMore])

  if (error) return

  if (loading || !data || rankLoading) {
    return (
      <main>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={48} />
          </Stack>
          <Divider sx={{ width: '100%' }}></Divider>
          <Stack spacing={1}>
            {Array.from(new Array(5)).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={48} />
            ))}
          </Stack>
        </Stack>
      </main>
    )
  }

  return (
    <main>
      <Stack spacing={2}>
        <Stack spacing={1}>
          {user && (
            <>
              <RankingProfile
                isMainProfile
                onClick={() => handleUserSelect(address, rank!)}
                position={rank!}
                points={user!.total_points}
                name={user!.superChainId}
                level={user!.level?.toString() || '0'}
                badges={user!.total_badges}
                noun={{
                  accessory: user!.noun.accessory,
                  background: user!.noun.background,
                  body: user!.noun.body,
                  glasses: user!.noun.glasses,
                  head: user!.noun.head,
                }}
              />
            </>
          )}
        </Stack>
        <Divider sx={{ width: '100%' }}></Divider>
        <Stack spacing={1} height="100%">
          {data.pages.map((page, pageIndex) =>
            page.data.map((user, index) => (
              <RankingProfile
                key={`${pageIndex}-${index}`}
                position={index + 1 + pageIndex * 20}
                points={user.total_points}
                onClick={() => handleUserSelect(user.superaccount, index + 1 + pageIndex * 20)}
                name={user.superChainId}
                level={user.level.toString()}
                isMainProfile={user.superaccount.toLowerCase() === address.toLowerCase()}
                badges={user.total_badges}
                noun={{
                  accessory: user.noun.accessory,
                  background: user.noun.background,
                  body: user.noun.body,
                  glasses: user.noun.glasses,
                  head: user.noun.head,
                }}
              />
            )),
          )}

          {hasMore &&
            (isFetching ? <Skeleton variant="rounded" height={48} /> : <InfiniteScroll onLoadMore={handleLoadMore} />)}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
