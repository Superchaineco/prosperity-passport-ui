import React from 'react'
import PageHeader from '@/components/common/PageHeader'
import css from '@/components/common/PageHeader/styles.module.css'
import LeaderboardNavigation from './LeaderboardNavigation'
import { Box, Typography } from '@mui/material'
import RefreshTimer from './RefreshTimer'

function LeaderboardHeader({ children }: { children?: React.ReactNode }) {
  return (
    <PageHeader
      title={
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h3" fontWeight={700}>
            Leaderboard
          </Typography>
          <RefreshTimer />
        </Box>
      }
      action={
        <div>
          <div className={css.pageHeader}>
            <div className={css.navWrapper}>
              <LeaderboardNavigation />
            </div>
            {children && <div className={css.actionsWrapper}>{children}</div>}
          </div>
        </div>
      }
    />
  )
}

export default LeaderboardHeader
