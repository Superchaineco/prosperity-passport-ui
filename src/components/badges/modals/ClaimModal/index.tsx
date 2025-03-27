import { Box, Button, Dialog, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import Shiny from '@/public/images/common/shiny-animation.svg'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import css from './styles.module.css'
import type { ClaimData } from '../../actions'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import CheckCircleIcon from '@/public/images/common/check-circle.svg'
import { GradientProgress } from '../..'

const claimData = {
  claimedBadges: ['5 transactions made on OP Mainnet'],
}

function ClaimModal({
  open,
  onClose,
  data,
  onLevelUp,
}: {
  open: boolean
  onClose: () => void
  data: ClaimData | null
  onLevelUp: () => void
}) {
  const { data: superChainAccount } = useAppSelector(selectSuperChainAccount)
  const progress =
    ((Number(superChainAccount.points) + (data?.totalPoints ?? 0)) / Number(superChainAccount.pointsToNextLevel)) * 100

  const claimData = {
    claimedBadges: data?.badgeUpdates.flatMap((badge: any) => {
      const previousLevel = Number(badge.previousLevel || 0)
      const currentLevel = Number(badge.level || 0)
      const levelDifference = currentLevel - previousLevel

      return Array(levelDifference)
        .fill(null)
        .map((_, index) => {
          const badgeTierIndex = previousLevel + index
          const updatedBadge = data.updatedBadges.find((updatedBadge: any) => badge.id === updatedBadge.id)
          return (
            updatedBadge?.metadata?.condition.replace(
              '{{variable}}',
              updatedBadge.badgeTiers[badgeTierIndex]?.metadata.minValue,
            ) || ''
          )
        })
    }),
  }

  return (
    <Dialog
      className={css.claimModal}
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        display="flex"
        flexDirection="column"
        gap="24px"
        padding="36px 24px 36px 24px"
        justifyContent="center"
        alignItems="center"
      >
        <Box gap="12px" display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="100%">
          <Typography id="modal-modal-title" fontSize={24} fontWeight={600} component="h2">
            Claim success
          </Typography>
          <Box
            width="100%"
            border={1}
            borderRadius="12px"
            borderColor="#E1E2EA"
            sx={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}
            padding="12px"
          >
            {claimData.claimedBadges.map((tx, index) => (
              <Box key={index}>
                <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="4px">
                  <Typography color="#4B4B4E" fontSize="14px">
                    {tx}
                  </Typography>
                  <SvgIcon
                    inheritViewBox
                    component={CheckCircleIcon}
                    sx={{
                      color: '#A3E635',
                      fontSize: '16px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" paddingLeft="12px" fontSize="16px">
          <Typography color="#75757A" fontWeight={500} fontSize="18px" pr={1}>
            You have recieved:
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            border={1}
            borderRadius="100px"
            borderColor="#E1E2EA"
            paddingX="8px"
          >
            <Typography fontSize="16px" fontWeight={600} p="4px 2px">
              {data?.totalPoints ?? 10 /*TODO Remove this*/}
            </Typography>
            <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="inherit" />
          </Box>
        </Box>
        <Box flex={1} width="100%">
          <GradientProgress variant="determinate" value={progress} />
          {!data?.isLevelUp && (
            <>
              <Typography variant="body2" align="center" mt={1} color="#75757A">
                {Number(superChainAccount.points)} /{' '}
                {Number(superChainAccount.points) + Number(superChainAccount.pointsToNextLevel)} Superchain Points to
                level {Number(superChainAccount.level) + 1}
              </Typography>
              <Button
                onClick={onClose}
                variant="contained"
                sx={{ width: '100%', mt: '30px', borderRadius: '30px', height: '60px' }}
              >
                Continue
              </Button>
            </>
          )}
          {data?.isLevelUp && (
            <>
              <Typography variant="body2" align="center" mt={1} color="#75757A">
                You have enough Superchain Points to level-up!
              </Typography>
              <button
                onClick={onLevelUp}
                className={css.levelUpButton}
                style={{ width: '100%', marginTop: '30px', borderRadius: '30px', height: '60px' }}
              >
                Level-up
                <Shiny className={css.shine} />
              </button>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}

export default ClaimModal
