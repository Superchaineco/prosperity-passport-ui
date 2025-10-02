import { BadgeResponse } from '@/types/super-chain'
import { Box, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import Image from 'next/image'
import { specialBadgeParsing } from '@/components/badges/badgeInfo'
import { getBadgeStrategy } from '@/components/badges/badgeInfo/BadgeStrategyRenderer'
import { SelfVerificationStrategy } from '@/components/badges/badgeInfo/strategies/SelfVerificationStrategy'
import { FarcasterLinkStrategy } from '@/components/badges/badgeInfo/strategies/FarcasterLinkStrategy'
import { CeloVaultStrategy } from '@/components/badges/badgeInfo/strategies/CeloVaultStrategy'

function Badges({ badges, isLoading }: { badges?: BadgeResponse[]; isLoading?: boolean }) {
  // Instancia de las estrategias de renderizado disponibles
  const strategies = useMemo(
    () => [new SelfVerificationStrategy(), new FarcasterLinkStrategy(), new CeloVaultStrategy()],
    [],
  )
  return (
    <>
      {isLoading ? (
        <>
          <Skeleton variant="circular" width={60} height={60} />
          <Skeleton variant="circular" width={60} height={60} />
          <Skeleton variant="circular" width={60} height={60} />
        </>
      ) : (
        badges?.map((badge, key) => {
          console.debug('Badge:', badge)

          // Buscar estrategia específica para este badge
          const strategy = getBadgeStrategy(badge.badge, strategies)

          // Generar descripción usando la estrategia si está disponible
          const getTooltipContent = () => {
            let description = badge.badge.metadata.condition.replace(
              '{{variable}}',
              badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata.minValue.toString(),
            )

            // Si hay una estrategia específica, intentar usar su formateo personalizado
            if (strategy && strategy.formatTierLabel) {
              try {
                const customLabel = strategy.formatTierLabel(
                  badge.badge as any,
                  parseInt(badge.tier),
                  badge.badge.badgeTiers[parseInt(badge.tier) - 1],
                )
                if (customLabel) {
                  description = customLabel
                }
              } catch (error) {
                // Si hay error de tipos, usar descripción por defecto
                console.debug('Error applying strategy formatting:', error)
              }
            }

            return specialBadgeParsing(badge.badge.metadata.name, description)
          }

          return (
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
                    {getTooltipContent()}
                  </Typography>
                  <Box justifyContent="center" alignItems="center" display="flex" gap={1}>
                    <strong>{badge.badge.badgeTiers[parseInt(badge.tier) - 1].points}</strong>
                    <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="medium" />
                  </Box>
                </Box>
              }
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <Image height={60} width={60} alt={badge.badge.metadata.name} src={badge.badge.metadata.image} />
                <Box display="flex" gap="4px" mt={1}>
                  {[...Array(parseInt(badge.tier))].map((_, i) => (
                    <Box key={i} width={6} height={6} borderRadius="100px" bgcolor="#39D551" />
                  ))}
                  {[...Array(badge.badge.badgeTiers.length - parseInt(badge.tier))].map((_, i) => (
                    <Box key={i} width={6} height={6} borderRadius="100px" bgcolor="#EBECF1" />
                  ))}
                </Box>
              </Box>
            </Tooltip>
          )
        })
      )}
    </>
  )
}

export default Badges
