import { Box, Button, Divider, Grid, InputAdornment, SelectChangeEvent, SvgIcon, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'

import SearchIcon from '@/public/images/common/search.svg'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useSafeInfo from '@/hooks/useSafeInfo'
import badgesService from '@/features/superChain/services/badges.service'
import type { Address } from 'viem'
import ClaimModal from '../modals/ClaimModal'
import LevelUpModal from '../modals/LevelUpModal'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import LoadingModal from '@/components/common/LoadingModal'
import FailedTxnModal from '@/components/common/ErrorModal'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { ResponseBadge, SuperChainAccount } from '@/types/super-chain'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export type ClaimData = {
  totalPoints: number
  isLevelUp: boolean
  badgeUpdates: {
    badgeId: string
    level: number
    points: number
    previousLevel: number
  }[]
  updatedBadges: {
    badgeId: string
    metadata: {
      condition: string
    }
    badgeTiers: {
      metadata: {
        minValue: string
      }
    }[]
  }[]
}
function BadgesActions({
  claimable,
  setFilter,
  setNetworks,
  selectedNetworks,
}: {
  claimable: boolean
  setFilter: (filter: string) => void
  setNetworks: (networks: string[]) => void
  selectedNetworks: string[]
}) {
  const { safeAddress, safeLoaded } = useSafeInfo()
  const { data: superChainAccount } = useAppSelector(selectSuperChainAccount)

  const router = useRouter()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false)
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const [selfUserId, setSelfUserId] = useState('')
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => {
      setIsLoadingModalOpen(true)
      return await badgesService.attestBadges(safeAddress as Address, { selfUserId })
    },
    onError: (error) => {
      setIsLoadingModalOpen(false)
      console.error(error)
    },
    onSuccess: (data) => {
      setIsLoadingModalOpen(false)
      queryClient.cancelQueries({ queryKey: ['superChainAccount', safeAddress] })
      queryClient.cancelQueries({ queryKey: ['badges', safeAddress, safeLoaded] })
      queryClient.setQueryData(['superChainAccount', safeAddress], (old: SuperChainAccount) => {
        return {
          ...old,
          points: data.points,
        }
      })
      queryClient.setQueryData(['badges', safeAddress, safeLoaded], (old: { currentBadges: ResponseBadge[] }) => {
        const badgeUpdates = old.currentBadges.map((badge) => {
          const update = data.badgeUpdates.find((update: ResponseBadge) => update.badgeId === badge.badgeId)
          if (update) {
            return {
              ...badge,
              level: update.level,
              points: update.points,
              claimable: false,
            }
          }
          return badge
        })
        return {
          currentBadges: [...old.currentBadges, ...badgeUpdates],
        }
      })
      queryClient.refetchQueries({ queryKey: ['superChainAccount', safeAddress] })
      setClaimData(data)
      setIsClaimModalOpen(true)
    },
  })

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent
      const data = customEvent.detail
      if (data?.userId) setSelfUserId(data.userId as string)
      mutate()
    }

    window.removeEventListener('claim-badges', handler)
    window.addEventListener('claim-badges', handler)

    return () => {
      window.removeEventListener('claim-badges', handler)
    }
  }, [mutate])
  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false)
    router.push({ pathname: AppRoutes.home, query: { safe: router.query.safe } })
  }

  const handleCloseLevelUpModal = () => {
    setIsLevelUpModalOpen(false)
    router.push({ pathname: AppRoutes.home, query: { safe: router.query.safe } })
  }

  const handleLevelUp = () => {
    setIsClaimModalOpen(false)
    setIsLevelUpModalOpen(true)
  }

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setNetworks(typeof value === 'string' ? value.split(',') : value)
  }

  return (
    <>
      <ClaimModal onLevelUp={handleLevelUp} data={claimData} open={isClaimModalOpen} onClose={handleCloseClaimModal} />
      <LevelUpModal
        open={isLevelUpModalOpen}
        level={Number(superChainAccount?.level)}
        onClose={handleCloseLevelUpModal}
      />
      <LoadingModal open={isLoadingModalOpen && isPending} title="Updating badges" />
      <FailedTxnModal open={isError} onClose={handleCloseLevelUpModal} handleRetry={() => mutate()} />
      <Grid container spacing={1} item>
        <Divider sx={{ mt: 1, mb: 2, width: '100%' }} />
        <Grid container spacing={2} item>
          <Grid item xs={12} lg={2.3}>
            <TextField
              placeholder="Search"
              sx={{
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                '& .MuiFilledInput-root': {
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  paddingX: '12px',
                  height: '34px',
                  '&:hover': {
                    backgroundColor: '#E0E0E0',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#FFFFFF',
                  },
                  '& input': {
                    padding: '4px 0',
                    '&::placeholder': {
                      color: 'black',
                      fontWeight: 'bold',
                      opacity: 1,
                    },
                  },
                },
              }}
              variant="filled"
              onChange={(e) => setFilter(e.target.value)}
              hiddenLabel
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon component={SearchIcon} inheritViewBox color="primary" fontSize="small" />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} lg={3}>
            <Box display="flex" gap={2}>
              <Box
                component="button"
                onClick={() => {
                  setFilter('')
                  setNetworks([])
                }}
                sx={{
                  borderRadius: '6px',
                  minWidth: '100px',
                  height: '34px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: 'black',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#E0E0E0',
                  },
                }}
              >
                Clear All
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} lg={6.7}>
            <Box display="flex" justifyContent="flex-end" width="100%">
              <Button
                fullWidth
                disabled={true}
                variant="contained"
                onClick={() => mutate()}
                endIcon={<SvgIcon component={AutorenewIcon} width={16} height={16} inheritViewBox color="inherit" />}
                sx={{
                  height: '34px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: 'black',
                  paddingX: '16px',
                  color: 'white',
                  maxWidth: { xs: '100%', lg: 'fit-content' },
                  '&:hover': {
                    backgroundColor: '#333',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#EBECF1',
                    color: '#A0A0A6',
                  },
                }}
              >
                Claim Badges
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesActions
