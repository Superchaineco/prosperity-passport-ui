import { Box, Typography, Card, CardContent, Divider } from '@mui/material'
import Image from 'next/image'
import { AppRoutes } from '@/config/routes'
import { GradientProgress } from '..'
import NavTabs from '@/components/common/NavTabs'
import RefreshTimer from '@/components/leaderboard/RefreshTimer'
import { getCurrentSeason, getSeasonByCode } from '@/services/season'

export const badgesNavItems = [
  {
    label: 'All-Time',
    href: AppRoutes.badges.allTime,
  },
  {
    label: 'Season 1',
    href: AppRoutes.badges.season1,
  },
]

function BadgesHeader({
  level,
  points,
  pointsToNextLevel,
  completeBadges,
  totalBadges,
  season,
  isLoading,
}: {
  level: number
  points: number
  completeBadges: number
  pointsToNextLevel: number
  totalBadges: number
  season?: { code: number; name: string }
  isLoading: boolean
}) {
  const progress = (points / pointsToNextLevel) * 100
  const currentSeason = getCurrentSeason()
  const seasonObject = getSeasonByCode(season?.code ?? 0)

  return (
    <Box p={1} sx={{ width: '100%' }}>
      <Box display="flex" alignItems="center" gap={2} pb={4}>
        <Typography variant="h2" fontWeight={700}>
          Badges
        </Typography>
        {currentSeason && (
          <RefreshTimer deadLine={currentSeason.toDate} message={`${currentSeason.name} • `} messageAfter=" left" />
        )}
      </Box>
      <NavTabs tabs={badgesNavItems} />
      <Divider sx={{ mb: 2, width: '100%' }} />

      <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} alignItems="stretch" width="100%">
        <Card
          sx={{
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { sm: '300px' },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            // border: '1px solid',
            // borderColor: (theme) => (!season ? theme.palette.grey[500] : '#6B5DE7'),
            backgroundColor: '#FCFCFD',
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Badges
              </Typography>

              {/* {season && (
                <Chip
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                        fontWeight={600}
                        fontSize={13}
                        sx={{
                          color: '#6B5DE7',
                          margin: '-5px',
                        }}
                      >
                        {season.name}
                      </Typography>
                      <Image
                        src="/images/badges/stars_custom.svg"
                        alt="Star Icon"
                        width={14}
                        height={14}
                        style={{ margin: '2px' }}
                      />
                    </Box>
                  }
                  sx={{
                    backgroundColor: '#F4F0FF',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #6B5DE7',
                  }}
                />
              )} */}
            </Box>

            <Typography variant="h1" sx={{ fontSize: '40px', mt: 2 }} fontWeight={600}>
              {completeBadges}/{totalBadges}
            </Typography>
          </CardContent>
        </Card>

        <Box flex={1} minWidth={0}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              // border: '1px solid',
              // borderColor: (theme) => theme.palette.grey[500],
              backgroundColor: '#FCFCFD',
            }}
          >
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Level
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Image src="/images/badges/star.svg" alt="Badge" width={50} height={50} />

                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="white"
                    sx={{
                      position: 'absolute',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'transparent',
                      pt: '50px',
                    }}
                  >
                    {level}
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: '50px', mx: 2 }} />

                <Box flex={1}>
                  <GradientProgress variant="determinate" value={progress} />
                  <Typography variant="body2" align="center" mt={1} color="text.secondary">
                    {points} / {pointsToNextLevel} Prosperity Points to level {level + 1}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default BadgesHeader
