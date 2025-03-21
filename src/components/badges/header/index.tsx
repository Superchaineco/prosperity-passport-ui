import { Box, Grid, LinearProgress, SvgIcon, Typography, Card, CardContent, Divider, styled, Chip } from '@mui/material'
import Image from 'next/image'
import NavTabs from '@/components/common/NavTabs'
import { AppRoutes } from '@/config/routes'

export const badgesNavItems = [
  {
    label: 'All-Time',
    href: AppRoutes.badges,
  },
  {
    label: 'Season 7',
    href: AppRoutes.badges,
  },
]

const GradientProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: 'transparent',
  border: '1px solid #D0D0D0',
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #8B0000 0%, #FF0000 100%)',
    borderRadius: 5,
  },
}))

function BadgesHeader({
  level,
  points,
  pointsToNextLevel,
  completeBadges,
  totalBadges,
  isLoading,
}: {
  level: number
  points: number
  completeBadges: number
  pointsToNextLevel: number
  totalBadges: number
  isLoading: boolean
}) {
  const progress = (points / (points + pointsToNextLevel)) * 100

  return (
    <>
      <Box p={1} sx={{ width: '100%' }}>
        <Typography variant="h2" fontWeight={700} gutterBottom pb={4}>
          Badges
        </Typography>
        <NavTabs tabs={badgesNavItems} />
        <Divider sx={{ mb: 2, width: '100%' }} />
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} md={5} sm={5} display="flex">
            <Card
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: (theme) => theme.palette.grey[500],
                backgroundColor: (theme) => theme.palette.grey[50],
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Badges
                  </Typography>
                  <Chip
                    label="Lifetime"
                    sx={{
                      backgroundColor: '#F4F4F5',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: '1px solid #D0D0D0',
                    }}
                  />
                </Box>

                <Typography variant="h1" sx={{ fontSize: '40px', mt: 2 }} fontWeight={600}>
                  {completeBadges}/{totalBadges}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7} sm={7}>
            <Card
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: (theme) => theme.palette.grey[500],
                backgroundColor: (theme) => theme.palette.grey[50],
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
                      {points} / {points + pointsToNextLevel} Superchain Points to level {level + 1}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default BadgesHeader
