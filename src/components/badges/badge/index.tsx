import { Box, SvgIcon, Typography } from '@mui/material'
import React, { useMemo, type SyntheticEvent } from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { ResponseBadge } from '@/types/super-chain'
import classNames from 'classnames'
import Image from 'next/image'
import SeasonChip from '../seasonChip'
import NetworkChip from '../networkChip'
function Badge({
  data,
  switchFavorite,
  setCurrentBadge,
  isFavorite,
}: {
  data: ResponseBadge
  switchFavorite: () => void
  setCurrentBadge: (badge: ResponseBadge & { isFavorite: boolean }) => void
  isFavorite: boolean
}) {
  const { safeAddress, safeLoading } = useSafeInfo()
  const handleSwitchFavorite = async (event: SyntheticEvent) => {
    event.stopPropagation()
    switchFavorite()
  }
  const unClaimed = useMemo(() => {
    if (data?.claimableTier === null || data?.tier === null || data.claimableTier === 0 || Number(data.tier) === 0)
      return false
    return Number(data?.tier) === data?.claimableTier
  }, [data])

  const handlePickBadge = () => {
    const badge: ResponseBadge = {
      ...data,
    }
    setCurrentBadge({ ...badge, isFavorite })
  }

  const renderNextTier = data.claimableTier === Number(data.tier)

  return (
    <Box sx={{ maxWidth: '100%' }} onClick={handlePickBadge} className={classNames(css.badgeContainer)}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '112px',
          overflow: 'hidden',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
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
        <SeasonChip season="S7" style="badge" />
        <NetworkChip network={data.metadata.chain} style="badge" />
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
          <Box height="100%" width="100%">
            {Number(data.tier) > 0 &&
              [...Array(Number(data.tier))].map((_, index) => {
                const totalBadges = Number(data.tier)
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
                            alt={isMainBadge ? data.metadata.platform : `Tier ${i}`}
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
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', paddingBottom: '0px', width: '100%', height: '100%' }}>
        <Box
          display="flex"
          flexDirection="column"
          gap="12px"
          padding="24px"
          sx={{ flexGrow: 1, width: '100%', boxSizing: 'border-box' }}
        >
          <Typography
            fontSize="18px"
            fontWeight={600}
            textAlign="start"
            fontFamily="Sora"
            sx={{ wordBreak: 'break-word' }}
          >
            {data.metadata.name}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
            {data.badgeTiers.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: '6px',
                  backgroundColor: index < Number(data.tier) ? '#39D551' : '#EBECF1',
                  borderRadius: '100px',
                }}
              />
            ))}
          </Box>
          <Typography color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {data.metadata.description}
          </Typography>
        </Box>
        <Box
          width="100%"
          border={1}
          borderRadius="100px"
          borderColor="#E1E2EA"
          sx={{
            borderStyle: 'dashed',
            marginTop: 'auto',
            marginBottom: '24px',
            marginX: '24px',
            maxWidth: 'calc(100% - 48px)',
          }}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          paddingLeft="12px"
          fontSize="16px"
        >
          <Typography fontWeight={500} color="#4B4B4E" fontSize="12px">
            Rewards next tier
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            border={1}
            borderRadius="100px"
            borderColor="#E1E2EA"
            paddingX="8px"
          >
            <Typography fontSize="12px" fontWeight={500}>
              50
            </Typography>
            <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="inherit" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Badge

{
  /* <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
          <IconButton disabled={safeLoading} onClick={(e) => handleSwitchFavorite(e)} className={css.hearth}>
            <SvgIcon component={isFavorite ? HeartFilled : Hearth} color="secondary" inheritViewBox fontSize="small" />
          </IconButton>
          {!!Number(data.tier) ? (
            <img
              width={72}
              height={72}
              src={data.badgeTiers[data.claimableTier! - 1].metadata['3DImage']}
              className={!unClaimed ? css.unclaimed : undefined}
              alt={data.metadata.platform}
            />
          ) : (
            <img
              width={72}
              height={72}
              src={data.badgeTiers[0].metadata['3DImage']}
              className={!unClaimed ? css.unclaimed : undefined}
              alt={data.metadata.platform}
            />
          )}
          <Typography margin={0} fontWeight={600} fontSize={16} textAlign="center" variant="h4">
            {data.metadata.name}
          </Typography>
          <Typography margin={0} fontSize={14} fontWeight={400} textAlign="center" color="text.secondary">
            {data.metadata.description}
          </Typography>
          {data.badgeTiers.length !== Number(data.tier) && (
            <Box border={2} borderRadius={1} padding="12px" borderColor="secondary.main">
              {!!Number(data.tier) ? (
                <>
                  <Typography margin={0} textAlign="center" color="secondary.main">
                    {renderNextTier ? 'Unlock Next Tier:' : 'Unlock First Tier:'}
                  </Typography>
                  <Typography textAlign="center" margin={0}>
                    {data.metadata.condition.replace(
                      '{{variable}}',
                      renderNextTier
                        ? data.badgeTiers[data.claimableTier || 0].metadata.minValue.toString()
                        : data.badgeTiers[data.claimableTier ? data.claimableTier - 1 : 0].metadata.minValue.toString(),
                    )}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography margin={0} textAlign="center" color="secondary.main">
                    Unlock First Tier:
                  </Typography>
                  <Typography textAlign="center" margin={0}>
                    {data.metadata.condition.replace('{{variable}}', data.badgeTiers[0].metadata.minValue.toString())}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Stack> */
}
