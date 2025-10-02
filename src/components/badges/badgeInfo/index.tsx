import { Box, Card, CardContent, CardMedia, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { ResponseBadge } from '@/types/super-chain'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'
import CheckCircleIcon from '@/public/images/common/check-circle.svg'
import NetworkChip from '../networkChip'
import BadgeStrategyRenderer, { getBadgeStrategy } from './BadgeStrategyRenderer'
import { SelfVerificationStrategy } from './strategies/SelfVerificationStrategy'
import { FarcasterLinkStrategy } from './strategies/FarcasterLinkStrategy'
import { CeloVaultStrategy } from './strategies/CeloVaultStrategy'

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

  const isCompleted = Number(currentBadge.tier) === currentBadge.badgeTiers.length
  const strategies = [new SelfVerificationStrategy(), new FarcasterLinkStrategy(), new CeloVaultStrategy()]
  const strategy = getBadgeStrategy(currentBadge, strategies)

  return (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="flex-start"
      sx={{
        pt: 'var(--header-height)',
        px: 0,
        width: '100%',
      }}
    >
      <Box
        display="flex"
        width="100%"
        paddingTop="24px"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Box display="flex" justifyContent="flex-end" width="100%" p="10px 30px 0px 30px">
          <Box display="flex" gap={1}>
            <IconButton onClick={handleSwitchFavorite} className={css.actionBtn}>
              <SvgIcon
                component={currentBadge?.isFavorite ? HeartFilled : Hearth}
                sx={{ color: '#FF0420', fontSize: '20px' }}
                inheritViewBox
              />
            </IconButton>

            <IconButton onClick={() => setCurrentBadge(null)} className={css.actionBtn}>
              <SvgIcon component={Close} sx={{ color: 'inherit', fontSize: '20px' }} inheritViewBox />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Card sx={{ border: 'none', borderRadius: '0px', width: '100%' }}>
        <br></br>
        <CardMedia
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '180px',
            overflow: 'hidden',
            border: 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${currentBadge.metadata.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(68px)',
              zIndex: 0,
              mixBlendMode: 'multiply',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
              {Number(currentBadge.tier) > 0 ? (
                [...Array(Number(currentBadge.tier))].map((_, index) => {
                  const totalBadges = Number(currentBadge.tier)
                  const centerIndex = (totalBadges - 1) / 2
                  const spacing = 24

                  return (
                    <Box
                      key="index"
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        {Array.from({ length: totalBadges }).map((_, i) => {
                          const offset = (i - centerIndex) * spacing

                          const isMainBadge = i === 0

                          return (
                            <Image
                              key={i}
                              src={isMainBadge ? currentBadge.metadata.image : currentBadge.metadata['stack-image']}
                              alt={isMainBadge ? currentBadge.metadata.platform : `Tier ${i}`}
                              width={72}
                              height={72}
                              style={{
                                position: 'absolute',
                                left: '50%',
                                transform: `translate(-50%, -50%) translateX(${offset}px)`,
                                zIndex: isMainBadge ? 999 : totalBadges - i,
                              }}
                            />
                          )
                        })}
                      </Box>
                    </Box>
                  )
                })
              ) : (
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
                  <Box sx={{ position: 'relative' }}>
                    <Image
                      src={currentBadge.metadata.image}
                      width={72}
                      height={72}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: `translate(-50%, -50%)`,
                        zIndex: 999,
                      }}
                      alt={currentBadge.metadata.platform}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </CardMedia>
        <CardContent>
          <Box display="flex" flexDirection="column" gap="12px" padding="20px">
            <Typography fontSize="18px" fontWeight={600} textAlign="start" fontFamily="Sora">
              {currentBadge?.metadata.name}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              {currentBadge.metadata.chains.map((chain) => (
                <NetworkChip network={chain} style="info" key="chain" isFavorite={currentBadge.isFavorite} />
              ))}
            </Stack>

            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <>
                {strategy?.renderDescription ? (
                  strategy.renderDescription(currentBadge)
                ) : (
                  <>
                    <Typography
                      color="#75757A"
                      dangerouslySetInnerHTML={{
                        __html: currentBadge?.metadata.description.replaceAll('FarCaster', 'Farcaster') ?? '',
                      }}
                    />
                  </>
                )}
                {currentBadge.claimable && <Chip label="Claimable" />}
              </>
            </Box>
            <Box
              width="100%"
              border={1}
              borderRadius="100px"
              borderColor={isCompleted ? '#39D551' : '#E1E2EA'}
              sx={{ borderStyle: isCompleted ? 'solid' : 'dashed' }}
              bgcolor={isCompleted ? '#EBFBEE' : 'transparent'}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              paddingLeft="12px"
              fontSize="16px"
            >
              <Stack direction="row" alignItems="center" gap={1}>
                {isCompleted && (
                  <SvgIcon
                    inheritViewBox
                    component={CheckCircleIcon}
                    sx={{ color: '#A3E635', fontSize: '16px', width: '16px', height: '16px', border: 'none' }}
                  />
                )}
                <Typography color="#4B4B4E" fontWeight={500} fontSize="12px">
                  {isCompleted ? 'Completed' : 'Rewards next tier'}
                </Typography>
              </Stack>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                border={1}
                borderRadius="100px"
                borderColor={isCompleted ? '#39D551' : '#E1E2EA'}
                borderBottom="none"
                borderRight="none"
                borderTop="none"
                paddingX="8px"
              >
                <Typography fontSize="12px" fontWeight={500}>
                  {
                    currentBadge.badgeTiers[currentBadge.claimableTier ? currentBadge.claimableTier - 1 : 0].metadata
                      .points
                  }
                </Typography>
                <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="inherit" />
              </Box>
            </Box>

            <Box
              width="100%"
              border={1}
              borderRadius="12px"
              borderColor={isCompleted ? '#39D551' : '#E1E2EA'}
              sx={{
                borderStyle: isCompleted ? 'solid' : 'dashed',
                backgroundColor: isCompleted ? '#EBFBEE' : 'transparent',
              }}
              padding="12px"
            >
              {strategy?.renderBadgeTiers
                ? strategy.renderBadgeTiers(currentBadge)
                : currentBadge.badgeTiers.map((tier, index) => (
                    <Box key={index}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="4px">
                        <Typography color="#4B4B4E" fontSize="12px">
                          {specialBadgeParsing(
                            currentBadge.badgeId,
                            currentBadge.metadata.condition.replace('{{variable}}', formatXP(tier.metadata.minValue)),
                            parseInt(tier.tier),
                          )}
                        </Typography>

                        <SvgIcon
                          inheritViewBox
                          component={tier.tier <= currentBadge.tier ? CheckCircleIcon : null}
                          sx={{
                            color: tier.tier <= currentBadge.tier ? '#A3E635' : 'grey',
                            fontSize: '16px',
                            width: '16px',
                            height: '16px',
                            border: tier.tier <= currentBadge.tier ? 'none' : '1px dashed #E1E2EA',
                            borderRadius: '50%',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
            </Box>

            <BadgeStrategyRenderer badge={currentBadge} strategies={strategies} />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}

export function specialBadgeParsing(badge: string, tierString: string, tierNumber?: number): string {
  if (badge === 'Community Guild Member' || badge.toString() === '25') {
    switch (tierString) {
      case '1 level Celorian':
      case '1':
        return 'Beginner Celorian'
      case '2 level Celorian':
      case '2':
        return 'Adventurer Celorian'
      case '3 level Celorian':
      case '3':
        return 'Vanguard Celorian'
      case '4 level Celorian':
      case '4':
        return 'Pioneer Celorian'
      case '5 level Celorian':
      case '5':
        return 'Champion Celorian'
      default:
        return tierString
    }
  }
  if (badge === 'USD GLO tiers' || badge.toString() === '13') {
    if (tierNumber) tierString = tierNumber.toString()
    switch (tierString) {
      case '1':
        return 'held > $1 Glo Dollar for more than 1 day'

      case '2':
        return 'held > $10 Glo Dollar for more than 7 days'

      case '3':
        return 'held > $100 Glo Dollar for more than 28 days'

      case '4':
        return 'held > $1000 Glo Dollar for more than 28 days'

      case '5':
        return 'held > $5000 Glo Dollar for more than 28 days'
      default:
        return tierString
    }
  }
  return tierString
}

export function formatXP(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2).replace(/\.00$/, '')}K`
  }
  return `${value}`
}

export default BadgeInfo
