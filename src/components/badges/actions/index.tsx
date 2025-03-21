import {
  Box,
  Button,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'

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
import { ResponseBadge } from '@/types/super-chain'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export type ClaimData = {
  badges: BadgeResponse[]
  totalPoints: number
  isLevelUp: boolean
}
function BadgesActions({
  claimable,
  setFilter,
  setNetwork,
  network,
}: {
  claimable: boolean
  setFilter: (filter: string) => void
  setNetwork: (network: string) => void
  network: string
}) {
  const { safeAddress, safeLoaded } = useSafeInfo()
  const { data: superChainAccount } = useAppSelector(selectSuperChainAccount)

  const router = useRouter()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => {
      return await badgesService.attestBadges(safeAddress as Address)
    },
    onError: (error) => {
      console.error(error)
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ['superChainAccount', safeAddress] })
      queryClient.cancelQueries({ queryKey: ['badges', safeAddress, safeLoaded] })
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
      setClaimData(data)
      setIsClaimModalOpen(true)
    },
  })

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false)
  }

  const handleCloseLevelUpModal = () => {
    setIsLevelUpModalOpen(false)
    router.push({ pathname: AppRoutes.home, query: { safe: router.query.safe } })
  }

  const handleLevelUp = () => {
    setIsClaimModalOpen(false)
    setIsLevelUpModalOpen(true)
  }

  return (
    <>
      <ClaimModal onLevelUp={handleLevelUp} data={claimData} open={isClaimModalOpen} onClose={handleCloseClaimModal} />
      <LevelUpModal
        open={isLevelUpModalOpen}
        level={Number(superChainAccount?.level)}
        onClose={handleCloseLevelUpModal}
      />
      <LoadingModal open={isPending} title="Updating badges" />
      <FailedTxnModal open={isError} onClose={handleCloseLevelUpModal} handleRetry={() => mutate()} />
      <Grid container spacing={1} item>
        <Divider sx={{ mt: 1, mb: 2, width: '100%' }} />
        <Grid container spacing={2} item>
          <Grid item xs={12} lg={2.3}>
            <TextField
              placeholder="Search"
              sx={{
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#F4F4F5',
                '& .MuiFilledInput-root': {
                  borderRadius: '20px',
                  backgroundColor: '#F4F4F5',
                  padding: '6px 12px',
                  minHeight: '36px',
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
              <Select
                fullWidth
                onChange={(e) => setNetwork(e.target.value)}
                defaultValue="all"
                value={network}
                displayEmpty
                sx={{
                  borderRadius: '20px',
                  backgroundColor: '#F4F4F5',
                  minHeight: '34px',
                  border: '1px solid transparent',
                  boxShadow: 'none',
                  maxWidth: { xs: '100%', lg: '200px' },
                  lineHeight: '2em',
                  '& .MuiSelect-select': {
                    padding: '6px 12px',
                    minHeight: '34px',
                    display: 'flex',

                    alignItems: 'center',
                  },
                  '&:hover': {
                    backgroundColor: '#E0E0E0',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#FFFFFF',
                    border: '1px solid black',
                  },
                  '&:before, &:after': {
                    border: 'none !important', // Forza la eliminación de cualquier línea residual
                    display: 'none !important',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none !important', // Asegura que el borde del `outlined` desaparezca
                  },
                }}
              >
                <MenuItem value="all">
                  <strong>Select network</strong>
                </MenuItem>
                <MenuItem value="optimism">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://safe-transaction-assets.safe.global/chains/10/chain_logo.png"
                      alt="Optimism Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Optimism</strong>
                  </Box>
                </MenuItem>
                <MenuItem value="base">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png"
                      alt="Base Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Base</strong>
                  </Box>
                </MenuItem>
                <MenuItem value="mode">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://account.superchain.eco/chains/34443/chain_logo.svg"
                      alt="Mode Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Mode</strong>
                  </Box>
                </MenuItem>
              </Select>
              <Box
                component="button"
                onClick={() => {
                  setFilter('')
                  setNetwork('all')
                }}
                sx={{
                  borderRadius: '20px',
                  minWidth: '100px',
                  minHeight: '36px',
                  padding: '6px 16px',
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
                disabled={!claimable || isPending}
                variant="contained"
                onClick={() => mutate()}
                endIcon={<SvgIcon component={AutorenewIcon} inheritViewBox color="inherit" />}
                sx={{
                  borderRadius: '20px',
                  minHeight: '36px',
                  backgroundColor: 'black',
                  color: 'white',
                  maxWidth: { xs: '100%', lg: '250px' },
                  '&:hover': {
                    backgroundColor: '#333',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#A0A0A0',
                    color: '#E0E0E0',
                  },
                }}
              >
                {isPending ? 'Loading' : 'Claim Badges'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesActions
