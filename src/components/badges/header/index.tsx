import { Box, Grid, LinearProgress, SvgIcon, Typography, Card, CardContent } from '@mui/material'
import Badge from '@/public/images/common/superChain.svg'
import NavTabs from '@/components/common/NavTabs'
import { AppRoutes } from '@/config/routes'

export const badgesNavItems = [
  {
    label: 'All-Time',
    href: AppRoutes.leaderboard.index,
  },
  {
    label: 'Season 7',
    href: AppRoutes.leaderboard.index,
  },
]

function BadgesHeader({ level, points, pointsToNextLevel, completeBadges, totalBadges, isLoading }) {
  const progress = (points / (points + pointsToNextLevel)) * 100

  return (
    <>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Badges
      </Typography>
      <NavTabs tabs={badgesNavItems} />

      <Grid container spacing={2} mt={2}>
        {/* Badges Count */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Badges
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {completeBadges}/{totalBadges}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Level Display */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <SvgIcon component={Badge} inheritViewBox fontSize="large" color="error" />
                <Typography variant="h6" color="text.secondary">
                  Level {level}
                </Typography>
              </Box>
              <Box mt={2}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="body2" align="center" mt={1}>
                  {points} / {points + pointsToNextLevel} Superchain Points to level {level + 1}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesHeader
