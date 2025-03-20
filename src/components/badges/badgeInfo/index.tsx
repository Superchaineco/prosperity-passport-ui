import { Box, Card, CardContent, CardMedia, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { ResponseBadge } from '@/types/super-chain'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Share from '@/public/images/common/share.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import classNames from 'classnames'

function BadgeInfo({
  currentBadge,
  setCurrentBadge,
  switchFavorite,
}: {
  currentBadge: (ResponseBadge & { isFavorite: boolean }) | null
  setCurrentBadge: (_: null | (ResponseBadge & { isFavorite: boolean })) => void
  switchFavorite: ({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) => void
}) {
  const { safe } = useSafeInfo()

  const unClaimed = useMemo(() => {
    if (currentBadge?.claimableTier === null || currentBadge?.tier === null) return false

    return currentBadge?.tier === currentBadge?.claimableTier
  }, [currentBadge])

  const handleSwitchFavorite = async () => {
    switchFavorite({
      id: currentBadge?.badgeId,
      account: safe.address.value as Address,
      isFavorite: !currentBadge?.isFavorite,
    })
    setCurrentBadge({
      ...currentBadge!,
      isFavorite: !currentBadge?.isFavorite,
    })
  }

  if (!currentBadge) return null

  const renderNextTier = currentBadge.claimableTier === Number(currentBadge.tier)
  const maxTierReached = Number(currentBadge.tier) === currentBadge.badgeTiers.length

  return (
    <Stack padding="24px" justifyContent="flex-start" alignItems="center" spacing={2} className={css.drawer}>
      <Box
        display="flex"
        width="100%"
        paddingTop="24px"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        {/* {!!Number(currentBadge.tier) ? (
          <img
            src={currentBadge.badgeTiers[currentBadge.claimableTier! - 1].metadata['3DImage']}
            className={!unClaimed ? css.unclaimed : undefined}
            alt={currentBadge.metadata.platform}
          />
        ) : (
          <img
            src={currentBadge.badgeTiers[0].metadata['3DImage']}
            className={!unClaimed ? css.unclaimed : undefined}
            alt={currentBadge.metadata.platform}
          />
        )} */}

        <Card className={classNames(css.badgeContainer)}>
          <CardMedia
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '112px',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url('/static/badges/LifeTerm/OpUser/Badge.svg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(68px)',
                opacity: 1,
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
              }}
            >
              <Box sx={{ position: 'relative' }}>
                {Number(1) > 0 &&
                  [...Array(Number(1))].map((_, index) => {
                    const totalBadges = Number(1) + 1
                    const centerIndex = (totalBadges - 1) / 2
                    const spacing = 24

                    return (
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ position: 'relative' }}></Box>
                      </Box>
                    )
                  })}
              </Box>
            </Box>
          </CardMedia>
          <CardContent>
            <Box display="flex" flexDirection="column" gap="12px" padding="24px">
              <Typography fontSize="18px" fontWeight={600} textAlign="start" fontFamily="Sora">
                {currentBadge?.metadata.name}
              </Typography>
              <Typography fontSize={14} fontWeight={500}>
                <strong color="text.secondary">Network: </strong>
                {currentBadge.metadata.platform}
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1}></Box>
              <Typography color="text.secondary">{currentBadge?.metadata.description}</Typography>
              <Box
                width="100%"
                border={1}
                borderRadius="100px"
                borderColor="text.secondary"
                sx={{ borderStyle: 'dashed' }}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                paddingLeft="12px"
                fontSize="16px"
              >
                <Typography fontSize="12px">Rewards next tier</Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  border={1}
                  borderRadius="100px"
                  borderColor="text.secondary"
                  paddingX="8px"
                >
                  <Typography fontSize="12px" fontWeight={500}>
                    50
                  </Typography>
                  <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="inherit" />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Box display="flex" gap={1} position="absolute" top="10%" right="0">
          <IconButton onClick={handleSwitchFavorite} className={css.actionBtn}>
            <SvgIcon
              component={currentBadge?.isFavorite ? HeartFilled : Hearth}
              style={{ color: 'red' }}
              inheritViewBox
              fontSize="small"
            />
          </IconButton>
          <IconButton onClick={() => setCurrentBadge(null)} className={css.actionBtn}>
            <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
        <Typography fontSize={20} fontWeight={600}>
          {currentBadge?.metadata.name}
        </Typography>
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {currentBadge?.metadata.description}
        </Typography>
      </Box>

      <Box
        border={2}
        borderRadius={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        padding="12px"
        flexDirection="column"
        width="100%"
        borderColor="border.light"
      >
        <Typography fontSize={14} fontWeight={500}>
          <strong color="text.secondary">Current Tier:</strong> {currentBadge.tier ? currentBadge.tier : 0}
        </Typography>
        {!maxTierReached && (
          <Typography fontSize={14} fontWeight={500}>
            {!!Number(currentBadge.tier) ? (
              <>
                <strong color="text.secondary">Next rewards: </strong>
                {renderNextTier
                  ? currentBadge.badgeTiers[currentBadge.claimableTier!].points
                  : currentBadge.badgeTiers[currentBadge.claimableTier! - 1].points}
              </>
            ) : (
              <>
                <strong color="text.secondary">First rewards:</strong>
                {currentBadge.badgeTiers[0].metadata.points}
              </>
            )}
          </Typography>
        )}
      </Box>
      {/* <Box
        border={2}
        borderRadius={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        padding="12px"
        flexDirection="column"
        borderColor="border.light"
      >
        <Typography fontSize={12} fontWeight={600}>
          Website:
        </Typography>
        <Link href="https://something.com">
          <Typography fontSize={12} fontWeight={500}>
            https://something.com
          </Typography>
        </Link>
      </Box> */}
      <Box display="flex" paddingTop={2} alignItems="center" justifyContent="center" flexDirection="column" gap="20px">
        <Typography fontWeight={600} fontSize={20}>
          My Badges ({currentBadge.tier}/{currentBadge?.badgeTiers.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap="12px">
          {currentBadge?.badgeTiers.map((tier, key) => (
            <Tooltip
              arrow
              key={key}
              title={
                <Box
                  display="flex"
                  gap="6px"
                  padding="12px"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography fontSize={14} textAlign="center" fontWeight={400}>
                    {currentBadge.metadata.condition.replace('{{variable}}', tier.metadata.minValue.toString())}
                  </Typography>

                  <Box justifyContent="center" alignItems="center" display="flex" gap={1}>
                    <strong>{tier.points}</strong>
                    <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="medium" />
                  </Box>
                </Box>
              }
            >
              <img
                style={{
                  height: 60,
                  width: 60,
                  opacity: tier.tier <= currentBadge.tier ? 1 : 0.5,
                }}
                src={tier.metadata['2DImage']}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

export default BadgeInfo
