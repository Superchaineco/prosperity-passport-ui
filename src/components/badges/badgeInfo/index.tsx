import { Box, Card, CardContent, CardMedia, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { ResponseBadge } from '@/types/super-chain'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'
import CheckCircleIcon from '@/public/images/common/check-circle.svg'
import NetworkChip from '../networkChip'
import SeasonChip from '../seasonChip'

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

  return (
    <Stack justifyContent="flex-start" alignItems="center" spacing={2} className={css.drawer}>
      <Box
        display="flex"
        width="100%"
        paddingTop="24px"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" p="10px 30px">
          {/* <SeasonChip season={currentBadge.metadata.season} style="info" /> */}

          {/* Íconos alineados a la derecha */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Botón de Favorito */}
            <IconButton onClick={handleSwitchFavorite} className={css.actionBtn}>
              <SvgIcon
                component={currentBadge?.isFavorite ? HeartFilled : Hearth}
                sx={{ color: 'red', fontSize: '20px' }}
                inheritViewBox
              />
            </IconButton>

            {/* Botón de Cerrar */}
            <IconButton onClick={() => setCurrentBadge(null)} className={css.actionBtn}>
              <SvgIcon component={Close} sx={{ color: 'inherit', fontSize: '20px' }} inheritViewBox />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <Card sx={{ border: 'none', borderRadius: 0, width: '100%' }}>
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
                <NetworkChip network={chain} style="info" isFavorite={currentBadge.isFavorite} />
              ))}
            </Stack>

            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <Typography color="#75757A">{currentBadge?.metadata.description}</Typography>
              {currentBadge.claimable && <Chip label="Claimable" />}
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
                <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="inherit" />
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
              {currentBadge.badgeTiers.map((tier, index) => (
                <Box key={index}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="4px">
                    <Typography color="#4B4B4E" fontSize="12px">
                      {currentBadge.metadata.condition.replace('{{variable}}', tier.metadata.minValue.toString())}
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
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default BadgeInfo
