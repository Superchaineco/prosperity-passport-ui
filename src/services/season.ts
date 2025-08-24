import { AppRoutes } from '@/config/routes'

function createSeason(name: string, code: number, fromDate: Date, toDate: Date, icon: any, link: string) {
  return {
    name,
    code,
    fromDate,
    toDate,
    icon,
    link,
    isActive: function () {
      const now = new Date()
      return this.fromDate <= now && this.toDate > now
    },
    status: function (): 'active' | 'inactive' | 'ending' {
      const now = new Date()
      const diff = this.toDate.getTime() - now.getTime()
      if (!this.isActive()) return 'inactive'
      else if (diff <= 10 * 24 * 60 * 60 * 1000) return 'ending'
      else return 'active'
    },
  }
}

export function getCurrentSeason() {
  const now = new Date()
  return seasons.find((season) => season.fromDate < now && season.toDate > now)
}
export function getSeasonByCode(code: number) {
  return seasons.find((season) => season.code === code)
}

export function getSeasonByName(name: string) {
  return seasons.find((season) => season.name === name)
}

export const seasons = [
  createSeason(
    'Season 1',
    1,
    new Date(Date.UTC(2025, 6, 31, 0, 0, 0, 0)),
    new Date(Date.UTC(2025, 11, 24, 23, 59, 59, 999)),
    null,
    AppRoutes.badges.season1,
  ),
]
