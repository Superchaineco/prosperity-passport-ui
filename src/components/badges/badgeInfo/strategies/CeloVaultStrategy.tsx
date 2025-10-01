import React from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { Box, Typography, SvgIcon } from '@mui/material'
import CheckCircleIcon from '@/public/images/common/check-circle.svg'
import Link from 'next/link'
import useSafeAddress from '@/hooks/useSafeAddress'

type VaultTier = { level: number; amountETH: string; days: number; label?: string }

class CeloVaultStrategy implements BadgeRenderStrategy {
  private tiers: VaultTier[]

  constructor(tiers?: VaultTier[]) {
    this.tiers = tiers ?? [
      { level: 1, amountETH: '10', days: 7 },
      { level: 2, amountETH: '100', days: 7 },
      { level: 3, amountETH: '1000', days: 7 },
      { level: 4, amountETH: '10000', days: 7 },
      { level: 5, amountETH: '10000', days: 28 },
    ]
  }

  canRender(badge: any): boolean {
    try {
      console.debug('CeloVaultStrategy checking badge:', badge)

      const name = badge?.metadata?.name || ''
      return name === 'Celo Vault Deposit'
    } catch {
      return false
    }
  }

  formatTierLabel(badge: any, level: number, tier?: any): string | undefined {
    const t = this.tiers.find((x) => x.level === Number(level))
    if (t) return t.label ?? `Deposit ${t.amountETH} CELO for ${t.days} days`
    if (tier?.metadata?.minValue) return `Deposit ${tier.metadata.minValue} CELO`
    return undefined
  }

  renderDescription(_: ResponseBadge): React.ReactNode {
    const VaultDescription: React.FC = () => {
      const account = useSafeAddress()
      return (
        <Typography color="#75757A">
          Deposit CELO in the stCELO{' '}
          <Link href={`/vaults?safe=celo:${account}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>
            Vault
          </Link>
        </Typography>
      )
    }
    return <VaultDescription />
  }

  renderBadgeTiers(badge: ResponseBadge): React.ReactNode {
    const currentLevel = Number(badge.tier) || 0
    return (
      <>
        {this.tiers.map((t) => (
          <Box key={t.level}>
            <Box display="flex" justifyContent="space-between" alignItems="center" paddingY="4px">
              <Typography color="#4B4B4E" fontSize="12px">
                {t.label ?? `Deposit ${t.amountETH} CELO for ${t.days} days`}
              </Typography>
              <SvgIcon
                inheritViewBox
                component={t.level <= currentLevel ? CheckCircleIcon : null}
                sx={{
                  color: t.level <= currentLevel ? '#A3E635' : 'grey',
                  fontSize: '16px',
                  width: '16px',
                  height: '16px',
                  border: t.level <= currentLevel ? 'none' : '1px dashed #E1E2EA',
                  borderRadius: '50%',
                }}
              />
            </Box>
          </Box>
        ))}
      </>
    )
  }
}

export { CeloVaultStrategy }
export default CeloVaultStrategy
