import { Box } from '@mui/material'
import React, { useMemo } from 'react'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'

const networks = {
  Optimism: 'https://safe-transaction-assets.safe.global/chains/10/chain_logo.png',
  Base: 'https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png',
  Mode: '/chains/34443/chain_logo.svg',
  Ethereum: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
  Lisk: '/chains/1135/chain_logo.svg',
} as const

interface NetworkChipProps {
  network: string
  style: 'badge' | 'info'
}
const NetworkChip: React.FC<NetworkChipProps> = ({ network, style }) => {
  const networkLogo = networks[network as keyof typeof networks]
  const isBadge = style === 'badge'

  return isBadge ? (
    <Image
      src={networkLogo}
      alt={`${network} Logo`}
      width={24}
      height={24}
      loading="lazy"
      style={{ position: 'absolute', right: '10px', top: '10px' }}
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
