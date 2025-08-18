'use client'

import { Box, SvgIcon, Typography } from '@mui/material'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import { useEffect, useState } from 'react'

function getTimeDiff(nextDeadline: Date): { days: number; hours: number; minutes: number } {
  const now = new Date()

  const diff = nextDeadline.getTime() - now.getTime()

  const totalMinutes = Math.max(Math.floor(diff / 60000), 0)
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  return { days, hours, minutes }
}

function RefreshTimer({ message, deadLine, messageAfter }: { message: string; deadLine: Date; messageAfter?: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeDiff(deadLine))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let totalMinutes = prev.days * 24 * 60 + prev.hours * 60 + prev.minutes - 1

        if (totalMinutes < 0) totalMinutes = 0

        const days = Math.floor(totalMinutes / (24 * 60))
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
        const minutes = totalMinutes % 60

        return { days, hours, minutes }
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1}
      sx={{
        backgroundColor: '#FFF',
        borderRadius: '999px',
        border: '1px solid #E1E2EA',
        px: 2,
        py: 0.5,
      }}
    >
      <SvgIcon component={TimerOutlinedIcon} fontSize="small" sx={{ color: 'black', fontSize: '16px' }} />
      <Typography fontSize="14px" fontWeight={400}>
        {message}
        <span style={{ fontWeight: 600 }}>
          {timeLeft.days}d : {timeLeft.hours.toString().padStart(2, '0')}h :{' '}
          {timeLeft.minutes.toString().padStart(2, '0')}m
        </span>
        {messageAfter}
      </Typography>
    </Box>
  )
}

export default RefreshTimer
