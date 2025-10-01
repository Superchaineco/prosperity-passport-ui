import React from 'react'
import type { ResponseBadge } from '@/types/super-chain'

interface BadgeRenderStrategy {
  canRender: (badgeOrClaim: any) => boolean
  render?: (badge: ResponseBadge) => React.ReactNode
  renderDescription?: (badge: ResponseBadge) => React.ReactNode
  renderBadgeTiers?: (badge: ResponseBadge) => React.ReactNode
  formatTierLabel?: (badge: ResponseBadge, level: number, tier?: any) => string | undefined
}

class DefaultBadgeStrategy implements BadgeRenderStrategy {
  canRender(badgeOrClaim: any): boolean {
    return true
  }

  render(badge: ResponseBadge): React.ReactNode {
    return null
  }

  renderDescription(badge: ResponseBadge): React.ReactNode {
    return null
  }

  renderBadgeTiers(badge: ResponseBadge): React.ReactNode {
    return null
  }

  formatTierLabel(badge: ResponseBadge, level: number, tier?: any): string | undefined {
    return undefined
  }
}

interface BadgeStrategyRendererProps {
  badge: ResponseBadge
  strategies: BadgeRenderStrategy[]
  defaultStrategy?: BadgeRenderStrategy
}

// Helper: devuelve la estrategia seleccionada para usar en distintas secciones
export const getBadgeStrategy = (
  badgeOrClaim: any,
  strategies: BadgeRenderStrategy[],
): BadgeRenderStrategy | undefined => {
  return strategies.find((s) => {
    try {
      return s.canRender(badgeOrClaim)
    } catch (err) {
      // si la estrategia falla al evaluar, no la consideramos
      return false
    }
  })
}

const BadgeStrategyRenderer: React.FC<BadgeStrategyRendererProps> = ({
  badge,
  strategies,
  defaultStrategy = new DefaultBadgeStrategy(),
}) => {
  const strategy = getBadgeStrategy(badge, strategies) ?? defaultStrategy
  // compatibilidad: si la estrategia provee `render` la usamos, si no, null
  return <>{strategy.render ? strategy.render(badge) : null}</>
}

export default BadgeStrategyRenderer
export type { BadgeRenderStrategy }
