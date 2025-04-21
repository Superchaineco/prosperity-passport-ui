import { ResponseBadge } from '@/types/super-chain'

export const badgeInterceptor = {
  interceptBadges: (badges: ResponseBadge[]) => {
    return badges.map((badge) => {
      if (badge.badgeId === '13') {
        return {
          ...badge,
          badgeTiers: [
            {
              ...badge.badgeTiers[0],
              condition: 'held > $1 Glo Dollar for more than 1 day',
            },
            {
              ...badge.badgeTiers[1],
              condition: 'held > $10 Glo Dollar for more than 7 days',
            },
            {
              ...badge.badgeTiers[2],
              condition: 'held > $100 Glo Dollar for more than 28 days',
            },
            {
              ...badge.badgeTiers[3],
              condition: 'held > $1000 Glo Dollar for more than 28 days',
            },
            {
              ...badge.badgeTiers[4],
              condition: 'held > $5000 Glo Dollar for more than 28 days',
            },
          ],
        }
      }
      return badge
    })
  },
}
