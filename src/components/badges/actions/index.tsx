import { Box, Button, Grid, InputAdornment, SvgIcon, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'

import SearchIcon from '@/public/images/common/search.svg'
import History from '@/public/images/common/history.svg'
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

export type ClaimData = {
  badgeImages: string[]
  totalPoints: number
  isLevelUp: boolean
}
function BadgesActions({
  claimable,
  setFilter,
  setNetwork,
}: {
  claimable: boolean
  setFilter: (filter: string) => void
  setNetwork: (network: string) => void
}) {
  const { safeAddress } = useSafeInfo()
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
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ['superChainAccount', safeAddress] })
      queryClient.refetchQueries({ queryKey: ['badges', safeAddress] })
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
        <Grid item>
          <Typography variant="h3" fontSize={16} fontWeight={600}>
            Badges
          </Typography>
        </Grid>
        <Grid container spacing={2} item>
          <Grid item xs={12} lg={9}>
            <TextField
              placeholder="Search by name or network"
              variant="filled"
              onChange={(e) => setFilter(e.target.value)}
              hiddenLabel
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} lg={3}>
            <Box display="flex" height="100%">
              <Button
                fullWidth
                disabled={!claimable || isPending}
                variant={isPending ? 'outlined' : 'contained'}
                color="secondary"
                onClick={() => mutate()}
                endIcon={<SvgIcon component={History} inheritViewBox color="primary" />}
              >
                {isPending ? 'Loading' : claimable ? 'Update Badges' : 'No claimable Badges'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesActions
