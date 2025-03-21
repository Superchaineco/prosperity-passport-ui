import { Box } from '@mui/material'
import React, { useMemo } from 'react'
import { Chip } from '@/components/common/Chip'
import Image from 'next/image'

const networks = {
  Optimism: 'https://safe-transaction-assets.safe.global/chains/10/chain_logo.png',
  Base: 'https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png',
  Mode: 'https://account.superchain.eco/chains/34443/chain_logo.svg',
  Ethereum: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
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

export default NetworkChip
