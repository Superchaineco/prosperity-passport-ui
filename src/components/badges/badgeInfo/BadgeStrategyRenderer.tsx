import React from 'react'
import type { ResponseBadge } from '@/types/super-chain'

interface BadgeRenderStrategy {
  canRender: (badge: ResponseBadge) => boolean
  render: (badge: ResponseBadge) => React.ReactNode
}

class DefaultBadgeStrategy implements BadgeRenderStrategy {
  canRender(badge: ResponseBadge): boolean {
    return true
  }

  render(badge: ResponseBadge): React.ReactNode {
    return null
  }
}

interface BadgeStrategyRendererProps {
  badge: ResponseBadge
  strategies: BadgeRenderStrategy[]
  defaultStrategy?: BadgeRenderStrategy
}

const BadgeStrategyRenderer: React.FC<BadgeStrategyRendererProps> = ({
  badge,
  strategies,
  defaultStrategy = new DefaultBadgeStrategy(),
}) => {
  const strategy = strategies.find((s) => s.canRender(badge)) || defaultStrategy
  return <>{strategy.render(badge)}</>
}

export default BadgeStrategyRenderer
export type { BadgeRenderStrategy }
