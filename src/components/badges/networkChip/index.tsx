import { Box } from '@mui/material'
import React, { useMemo } from 'react'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'
import { networks } from '..'

interface NetworkChipProps {
  network: string
  style: 'badge' | 'info'
  isFavorite: boolean
}
const NetworkChip: React.FC<NetworkChipProps> = ({ network, style, isFavorite }) => {
  const networkLogo = networks.find((x) => x.value === network)?.icon ?? ''
  const isBadge = style === 'badge'

  return isBadge ? (
    <Image
      src={networkLogo}
      alt={`${network} Logo`}
      width={24}
      height={24}
      loading="lazy"
      style={{ position: 'absolute', right: isFavorite ? '40px' : '10px', top: '10px' }}
    />
  ) : (
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

export default NetworkChip
