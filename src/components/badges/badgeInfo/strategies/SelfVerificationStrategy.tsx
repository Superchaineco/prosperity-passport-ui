import React from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { MemoizedSelfVerificationComponent } from './SelfVerificationComponent'

class SelfVerificationStrategy implements BadgeRenderStrategy {
  canRender(badge: ResponseBadge): boolean {
    return badge.metadata.name === 'Self verification'
  }

  render(badge: ResponseBadge): React.ReactNode {
    return <MemoizedSelfVerificationComponent badge={badge} />
  }
}

export { SelfVerificationStrategy }
