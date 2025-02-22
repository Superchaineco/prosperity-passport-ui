import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import { Box } from '@mui/material'
import Head from 'next/head'
import React from 'react'

function Monthly() {
  return (
    <>
      <Head>
        <title>Prosperity Account – Leaderboard</title>
      </Head>
      <Box width="100%" height="100%">
        <LeaderboardHeader />
      </Box>
    </>
  )
}

export default Monthly
