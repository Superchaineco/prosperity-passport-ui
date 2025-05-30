import { Box, Divider, Skeleton, Stack } from '@mui/material'
import React from 'react'
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

  const { data, isLoading, error, isFetchingNextPage, fetchNextPage, hasNextPage } = useLeaderboard(address as Address)

  const {
    rank,
    error: rankError,
    loading: rankLoading,
  } = useUserRank(address as Address, isLoading, isLoading ? '0' : data?.pages[0]?.user?.points)

  const mainUser = data?.pages[0]?.user
  const allUsers = data?.pages.flatMap((p) => p.users) ?? []

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  if (error || rankError) return null

  if (isLoading || rankLoading || !mainUser) {
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
            onClick={() => handleUserSelect(address, rank!, mainUser.nationality)}
            position={rank!}
            points={mainUser.points}
            name={mainUser.superChainId}
            level={mainUser.level}
            badges={mainUser.badges.reduce((acc: any, badge: any) => acc + parseInt(badge.tier), 0)}
            nationality={mainUser.nationality}
            noun={{
              accessory: parseInt(mainUser.noun_accessory),
              background: parseInt(mainUser.noun_background),
              body: parseInt(mainUser.noun_body),
              glasses: parseInt(mainUser.noun_glasses),
              head: parseInt(mainUser.noun_head),
            }}
          />
        </Stack>
        <Stack spacing={1} height="100%">
          <Box sx={{ pb: '12px', pt: '12px', width: '100%' }}>
            <Divider sx={{ width: '100%' }} />
          </Box>
          {allUsers.map((user, index) => (
            <RankingProfile
              key={user.safe}
              position={index + 1}
              points={user.points}
              onClick={() => handleUserSelect(user.safe, index + 1, user.nationality)}
              name={user.superChainId}
              level={user.level}
              isMainProfile={user.safe.toLowerCase() === address.toLowerCase()}
              badges={user.badges.reduce((acc: any, badge: any) => acc + parseInt(badge.tier), 0)}
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
          {hasNextPage &&
            (isFetchingNextPage ? (
              <Skeleton variant="rounded" height={48} />
            ) : (
              <InfiniteScroll onLoadMore={handleLoadMore} />
            ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
