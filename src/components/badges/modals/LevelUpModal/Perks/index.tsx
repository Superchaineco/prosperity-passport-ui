import { Box, Skeleton, SvgIcon, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import type { Perks } from '@/features/superChain/services/badges.service'
import LockOpenIcon from '@mui/icons-material/LockOpen'

function Perks({ data, isLoading }: { data: Perks | undefined; isLoading: boolean }) {
  const perks = useMemo(() => {
    if (!data) {
      return {
        raffle: { value: 0 },
        sponsoredTxns: { value: 0 },
      }
    }
    return {
      raffle: {
        value: data.find((perk) => perk.name === 'SuperChainRaffle')?.value ?? 0,
      },
      sponsoredTxns: {
        value: data.find((perk) => perk.name === 'SponsoredTxns')?.value ?? 0,
      },
    }
  }, [data])

  return (
    <Box
      display="flex"
      width="100%"
      flexDirection="column"
      gap="12px"
      flexWrap="wrap"
      sx={{
        border: '1px solid gray',
        borderRadius: '20px',
        padding: '8px',
        mt: '20px',
      }}
    >
      {isLoading ? (
        <>
          <Skeleton variant="rounded" width="100%" height={30} />
          <Skeleton variant="rounded" width="100%" height={30} />
        </>
      ) : (
        <>
          {[
            { label: `Claim ${perks.raffle?.value ?? 0} tickets per week` },
            { label: `${perks.sponsoredTxns?.value ?? 0} Sponsored Transactions per week` },
          ].map((item, index) => (
            <Box key={index} display="flex" alignItems="center" gap={1} paddingY="1px">
              <SvgIcon component={LockOpenIcon} sx={{ color: '#EF4444', fontSize: '16px' }} />
              <Typography fontSize="14px" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  )
}

export default Perks
