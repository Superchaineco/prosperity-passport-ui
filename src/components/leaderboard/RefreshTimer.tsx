'use client'

import { Box, SvgIcon, Typography } from '@mui/material'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import { useEffect, useState } from 'react'

function getNextDeadlineUTC(): Date {
  const now = new Date()

  const result = new Date(now)
  const currentUTCDay = now.getUTCDay()
  const daysUntilSunday = currentUTCDay === 0 ? 7 : 7 - currentUTCDay

  result.setUTCDate(now.getUTCDate() + daysUntilSunday)
  result.setUTCHours(23, 59, 59, 999)

  return result
}

function getTimeDiff(): { days: number; hours: number; minutes: number } {
  const now = new Date()
  const nextDeadline = getNextDeadlineUTC()
  const diff = nextDeadline.getTime() - now.getTime()

  const totalMinutes = Math.max(Math.floor(diff / 60000), 0)
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  return { days, hours, minutes }
}
function RefreshTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeDiff())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeDiff())
    }, 60000)

    setTimeLeft(getTimeDiff())

    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1}
      sx={{
        backgroundColor: '#EDEDF2',
        borderRadius: '999px',
        px: 2,
        py: 0.5,
      }}
    >
      <SvgIcon component={TimerOutlinedIcon} fontSize="small" sx={{ color: 'black', fontSize: '16px' }} />
      <Typography fontSize="14px" fontWeight={400}>
        Refreshes in{' '}
        <span style={{ fontWeight: 600 }}>
          {timeLeft.days}d : {timeLeft.hours.toString().padStart(2, '0')}h :{' '}
          {timeLeft.minutes.toString().padStart(2, '0')}m
        </span>
      </Typography>
    </Box>
  )
}

export default RefreshTimer
