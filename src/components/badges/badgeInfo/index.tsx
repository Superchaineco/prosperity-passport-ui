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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

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

  const transactions = [
    { label: '10 transactions on Base', completed: true },
    { label: '25 transactions on Base', completed: true },
    { label: '500 transactions on Base', completed: false },
    { label: '10,000 transactions on Base', completed: false },
  ]

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
          <Chip
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography fontWeight={600} sx={{ color: '#6B5DE7', margin: '-5px' }}>
                  S7
                </Typography>
                <Image
                  src="/images/badges/stars_custom.svg"
                  alt="Star Icon"
                  width={14}
                  height={14}
                  style={{ margin: '2px' }}
                />
              </Box>
            }
            sx={{
              borderRadius: '18px',
              border: '1px solid #6B5DE7',
              backgroundColor: '#F4F0FF',
              padding: '6px 10px',
              height: '32px',
              maxWidth: '60px',
              fontWeight: 600,
            }}
          />

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
      <Card sx={{ border: 'none', borderRadius: 0 }}>
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
              {Number(currentBadge.tier) > 0 &&
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
                              src={
                                isMainBadge
                                  ? '/static/badges/LifeTerm/OpUser/Badge.svg'
                                  : '/static/badges/LifeTerm/OpUser/Stack.svg'
                              }
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
                })}
            </Box>
          </Box>
        </CardMedia>
        <CardContent>
          <Box display="flex" flexDirection="column" gap="12px" padding="20px">
            <Typography fontSize="18px" fontWeight={600} textAlign="start" fontFamily="Sora">
              {currentBadge?.metadata.name}
            </Typography>
            <NetworkChip network={currentBadge.metadata.platform}></NetworkChip>

            <Box display="flex" justifyContent="center" alignItems="center" gap={1}></Box>
            <Typography color="#75757A">{currentBadge?.metadata.description}</Typography>
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

            <Box
              width="100%"
              border={1}
              borderRadius="12px"
              borderColor="text.secondary"
              sx={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}
              padding="12px"
            >
              {transactions.map((tx, index) => (
                <Box key={index}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="4px">
                    <Typography fontSize="14px">{tx.label}</Typography>
                    <SvgIcon
                      component={tx.completed ? CheckCircleIcon : null}
                      sx={{
                        color: tx.completed ? '#A3E635' : 'grey',
                        fontSize: '18px',
                        border: tx.completed ? 'none' : '1px dotted',
                        borderColor: 'text.secondary',
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
const networks = {
  Optimism: 'https://safe-transaction-assets.safe.global/chains/10/chain_logo.png',
  Base: 'https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png',
  Mode: 'https://account.superchain.eco/chains/34443/chain_logo.svg',
} as const

interface NetworkChipProps {
  network: string
}
const NetworkChip: React.FC<NetworkChipProps> = ({ network }) => {
  const networkLogo = networks[network as keyof typeof networks]

  return (
    <Chip
      label={
        <Box display="flex" gap={1} alignItems="center">
          <Image src={networkLogo} alt={`${network} Logo`} width={24} height={24} loading="lazy" />
          <strong>{network}</strong>
        </Box>
      }
      sx={{
        borderRadius: '18px',
        color: 'black',
        border: '1px solid #E1E2EA',
        backgroundColor: 'transparent',
        height: '32px',
        fontWeight: 600,
        minWidth: 'auto',
        alignSelf: 'flex-start',
        maxWidth: 'fit-content',
      }}
    />
  )
}

export default BadgeInfo
