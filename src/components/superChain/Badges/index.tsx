import { BadgeResponse } from '@/types/super-chain'
import { Box, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import React from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import Image from 'next/image'

function Badges({ badges, isLoading }: { badges?: BadgeResponse[]; isLoading?: boolean }) {
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
                    {badge.badge.metadata.condition.replace(
                      '{{variable}}',
                      badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata.minValue.toString(),
                    )}
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
