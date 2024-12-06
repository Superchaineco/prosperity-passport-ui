import { Box, Card, CardActions, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useMemo, type SyntheticEvent } from 'react'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { ResponseBadge } from '@/types/super-chain'
import classNames from 'classnames'
import Complete from '@/public/images/common/complete.svg'

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
    <Card
      onClick={handlePickBadge}
      className={classNames(css.badgeContainer, data.badgeTiers.length === Number(data.tier) && css.badgeComplete)}
    >
      <CardContent>
        <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
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
        </Stack>
      </CardContent>
      <CardActions>
        <Box width="100%" display="flex" gap={1} pt={3} justifyContent="center" alignItems="center">
          {data.badgeTiers.length !== Number(data.tier) ? (
            <>
              <strong>
                {renderNextTier
                  ? data.badgeTiers[data.claimableTier || 0].points
                  : !!Number(data.tier)
                  ? data.points
                  : data.badgeTiers[0].points}
              </strong>{' '}
              <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="medium" />
            </>
          ) : (
            <>
              <strong>Complete</strong> <SvgIcon component={Complete} inheritViewBox fontSize="medium" />
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  )
}

export default Badge
