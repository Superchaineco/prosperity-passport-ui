import type { Address } from 'viem'
import type { GetUserBadgesQuery } from './.graphclient'

export type WeeklyGasBalance = {
  maxGasInUSD: bigint
  gasUsedInUSD: bigint
}
export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
  pointsToNextLevel: bigint | null
  weeklyGasBalance: WeeklyGasBalance
}
export type Badge = GetUserBadgesQuery['accountBadges'][number]
export type ResponseBadge = { tier: string; points: string } & Badge['badge'] & {
    claimableTier: number | null
    claimable: boolean
  }
export type SuperChainSmartAccountResponse = [Address, string, string, string, string[]]

export type BadgeMetadata = {
  badgeId: number
  level: number
  minValue: number
  '2DImage': string
  '3DImage': string
  points: number
}

export type BadgeTier = {
  points: string
  tier: string
  uri: string
  metadata: BadgeMetadata
}

export type BadgeResponse = {
  points: string
  tier: string
  badge: {
    badgeId: string
    uri: string
    badgeTiers: BadgeTier[]
  }
}

export type UserResponse = {
  superchainsmartaccount: SuperChainSmartAccountResponse
  badges: BadgeResponse[]
}
