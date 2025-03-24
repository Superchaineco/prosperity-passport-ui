import { Grid, LinearProgress, styled } from '@mui/material'
import React, { useMemo, useState } from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import type { ResponseBadge } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import badgesService from '@/features/superChain/services/badges.service'
import useSafeInfo from '@/hooks/useSafeInfo'

export const networks = [
  {
    label: 'OP ',
    value: 'optimism',
    icon: 'https://safe-transaction-assets.safe.global/chains/10/chain_logo.png',
  },
  { label: 'Base', value: 'base', icon: 'https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png' },
  { label: 'Mode', value: 'mode', icon: '/chains/34443/chain_logo.svg' },
  { label: 'Ethereum', value: 'ethereum', icon: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png' },
  { label: 'Lisk', value: 'lisk', icon: '/chains/1135/chain_logo.svg' },
]

export const GradientProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: 'transparent',
  border: '1px solid #D0D0D0',
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #8B0000 0%, #FF0000 100%)',
    borderRadius: 5,
  },
}))

function Badges({ season }: { season?: { code: string; name: string } }) {
  const { data: superChainAccount, loading: isSuperChainLoading } = useAppSelector(selectSuperChainAccount)
  const { safeAddress, safeLoaded } = useSafeInfo()
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([])

  const { data, isLoading, error } = useQuery<{
    currentBadges: ResponseBadge[]
  }>({
    queryKey: ['badges', safeAddress, safeLoaded],
    queryFn: async () => await badgesService.getBadges(safeAddress as `0x${string}`),
    refetchInterval: 10000,
    enabled: !!safeLoaded,
  })
  const isClaimable = useMemo(() => data?.currentBadges.some((badge) => badge.claimable), [data?.currentBadges])
  const currentPageBadges = season
    ? data?.currentBadges.filter((x) => x.metadata.season === season.code)
    : data?.currentBadges
  const filteredBadges = useMemo(() => {
    if (!data || !currentPageBadges) return []

    let filtered = currentPageBadges

    if (searchTerm) {
      filtered = filtered.filter(
        (badge) =>
          badge.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          badge.metadata.platform.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (selectedNetworks.length > 0) {
      filtered = filtered.filter((badge) =>
        badge.metadata.chains?.some((chain: string) =>
          selectedNetworks.some((selected) => chain.toLowerCase() === selected.toLowerCase()),
        ),
      )
    }

    return filtered
  }, [data?.currentBadges, searchTerm, selectedNetworks])
  return (
    <Grid p={1} spacing={2} container>
      <BadgesHeader
        level={Number(superChainAccount.level)}
        points={Number(superChainAccount.points)}
        pointsToNextLevel={Number(superChainAccount.pointsToNextLevel ?? superChainAccount.points)}
        totalBadges={currentPageBadges?.reduce((acc, badge) => acc + badge.badgeTiers.length, 0) ?? 0}
        season={season}
        completeBadges={
          currentPageBadges?.reduce((acc, badge) => {
            acc += Number(badge.tier)
            return acc
          }, 0) ?? 0
        }
        isLoading={isLoading || isSuperChainLoading}
      />
      <BadgesActions
        setNetworks={setSelectedNetworks}
        setFilter={setSearchTerm}
        claimable={isClaimable ?? false}
        selectedNetworks={selectedNetworks}
      />
      <BadgesContent badges={filteredBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
