import { Box, Divider, Skeleton, Stack } from '@mui/material'
import React, { useCallback, useState } from 'react'
import RankingProfile from './RankingProfile/index'
import { useLeaderboard } from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { Address } from 'viem'
import { useUserRank } from '@/hooks/super-chain/useUserRank'
import InfiniteScroll from '../common/InfiniteScroll'

function Leaderboard({
  handleUserSelect,
}: {
  handleUserSelect: (_: string, rank: number, nationality: string | undefined) => void
}) {
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
          <RankingProfile
            isMainProfile
            onClick={() => handleUserSelect(address, rank!, data!.superChainSmartAccount.nationality)}
            position={rank!}
            points={data!.superChainSmartAccount.points}
            name={data!.superChainSmartAccount.superChainId}
            level={data!.superChainSmartAccount.level}
            badges={data!.superChainSmartAccount.badges.reduce((acc, badge) => acc + parseInt(badge.tier), 0)}
            nationality={data!.superChainSmartAccount.nationality}
            noun={{
              accessory: parseInt(data!.superChainSmartAccount.noun_accessory),
              background: parseInt(data!.superChainSmartAccount.noun_background),
              body: parseInt(data!.superChainSmartAccount.noun_body),
              glasses: parseInt(data!.superChainSmartAccount.noun_glasses),
              head: parseInt(data!.superChainSmartAccount.noun_head),
            }}
          />
        </Stack>
        <Stack spacing={1} height="100%">
          <Box sx={{ pb: '12px', pt: '12px', width: '100%' }}>
            <Divider sx={{ width: '100%' }}></Divider>
          </Box>
          {data?.superChainSmartAccounts.map((user, index) => (
            <RankingProfile
              key={index}
              position={index + 1}
              points={user.points}
              onClick={() => handleUserSelect(user.safe, index + 1, user.nationality)}
              name={user.superChainId}
              level={user.level}
              isMainProfile={user.safe.toLowerCase() === address.toLowerCase()}
              badges={user.badges.reduce((acc, badge) => acc + parseInt(badge.tier), 0)}
              nationality={user.nationality}
              noun={{
                accessory: parseInt(user.noun_accessory),
                background: parseInt(user.noun_background),
                body: parseInt(user.noun_body),
                glasses: parseInt(user.noun_glasses),
                head: parseInt(user.noun_head),
              }}
            />
          ))}

          {hasMore &&
            (isFetching ? <Skeleton variant="rounded" height={48} /> : <InfiniteScroll onLoadMore={handleLoadMore} />)}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
