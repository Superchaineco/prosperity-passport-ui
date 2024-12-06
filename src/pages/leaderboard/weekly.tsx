import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import WeeklyLeaderboard from '@/components/leaderboard/Weekly'
import { Box } from '@mui/material'
import Head from 'next/head'
import React from 'react'

function Weekly() {
  return (
    <>
      <Head>
        <title>Prosperity Passport – Leaderboard</title>
      </Head>
      <Box width="100%" height="100%">
        <LeaderboardHeader />
        <WeeklyLeaderboard />
      </Box>
    </>
  )
}

export default Weekly
