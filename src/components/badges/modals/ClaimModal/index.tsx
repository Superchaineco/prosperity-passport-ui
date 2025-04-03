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
    Number(superChainAccount.points) + (data?.totalPoints ?? 0) > Number(superChainAccount.pointsToNextLevel)
      ? 100
      : ((Number(superChainAccount.points) + (data?.totalPoints ?? 0)) / Number(superChainAccount.pointsToNextLevel)) *
        100

  const claimData = {
    claimedBadges: data?.badgeUpdates.flatMap((badge: any) => {
      const updatedBadge = data.updatedBadges.find((ub: any) => ub.badgeId === badge.badgeId)
      if (!updatedBadge) return []

      const previousLevel = Number(badge.previousLevel || 0)
      const currentLevel = Number(badge.level)
      const levels = Array.from({ length: currentLevel - previousLevel }, (_, i) => previousLevel + i + 1)

      return levels
        .map((level) => {
          const badgeTier = updatedBadge.badgeTiers.find((tier: any) => Number(tier.metadata.level) === level)
          if (!badgeTier) return ''
          return updatedBadge.metadata.condition.replace('{{variable}}', badgeTier.metadata.minValue)
        })
        .filter(Boolean)
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
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              {claimData.claimedBadges?.slice(0, 6).map((tx, index) => (
                <Box key={index}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="6px">
                    <Typography color="#4B4B4E" fontSize="12px" fontWeight={500}>
                      {tx}
                    </Typography>
                    <SvgIcon
                      inheritViewBox
                      component={CheckCircleIcon}
                      sx={{
                        color: '#39D551',
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
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" paddingLeft="12px" fontSize="16px">
          <Typography color="#75757A" fontWeight={500} fontSize="18px" pr={1}>
            You have received:
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            border={1}
            borderRadius="100px"
            borderColor="#E1E2EA"
            paddingX="8px"
          >
            <Typography fontSize="16px" fontWeight={600} p="4px 2px">
              {data?.totalPoints ?? 0}
            </Typography>
            <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="inherit" />
          </Box>
        </Box>
        <Box flex={1} width="100%">
          <GradientProgress variant="determinate" value={progress} />
          {!data?.isLevelUp && (
            <>
              <Typography variant="body2" align="center" mt={1} color="#75757A">
                {Number(superChainAccount.points) + Number(data?.totalPoints ?? 0)} /{' '}
                {Number(superChainAccount.pointsToNextLevel)} Prosperity Points to level{' '}
                {Number(superChainAccount.level) + 1}
              </Typography>
              <Button
                onClick={onClose}
                variant="contained"
                sx={{ width: '100%', mt: '30px', borderRadius: '30px', height: '48px' }}
              >
                Continue
              </Button>
            </>
          )}
          {data?.isLevelUp && (
            <>
              <Typography variant="body2" align="center" mt={1} color="#75757A">
                You have enough Prosperity Points to level-up!
              </Typography>
              <button onClick={onLevelUp} className={css.levelUpButton}>
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
