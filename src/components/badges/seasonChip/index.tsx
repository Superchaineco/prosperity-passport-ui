import { Box, Typography } from '@mui/material'
import React from 'react'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'

function SeasonChip({ season, style }: { season: string; style: 'info' | 'badge' }) {
  const isBadge = style === 'badge'

  return (
    <Chip
      label={
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography
            fontWeight={600}
            sx={{
              color: '#6B5DE7',
              margin: '-5px',
            }}
          >
            {season}
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
        position: isBadge ? 'absolute' : 'static',
        top: isBadge ? '10px' : '',
        left: isBadge ? '10px' : '',
        borderRadius: '18px',
        border: '1px solid #6B5DE7',
        backgroundColor: '#F4F0FF',
        padding: '6px 10px',
        height: '32px',
        maxWidth: '60px',
        fontWeight: 600,
        transform: isBadge ? 'scale(0.8)' : 'scale(1)',
        transformOrigin: 'top left', // Mantiene la posición en `badge`
      }}
    />
  )
}

export default SeasonChip
