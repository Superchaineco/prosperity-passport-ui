import countries from 'i18n-iso-countries'
import 'i18n-iso-countries/langs/en.json'
import React, { useEffect, useState } from 'react'
import 'flag-icons/css/flag-icons.min.css'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material'

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

type Props = {
  alpha3: string
  size?: number
  sx?: SxProps<Theme>
}

const CountryFlag: React.FC<Props> = ({ alpha3, size = 100, sx }) => {
  const alpha2 = countries.alpha3ToAlpha2(alpha3.toUpperCase())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const timeout = requestAnimationFrame(() => setIsReady(true))
    return () => cancelAnimationFrame(timeout)
  }, [])

  if (!alpha2) {
    return <Skeleton variant="rectangular" width={size} height={size * 0.75} sx={{ borderRadius: 1, ...sx }} />
  }

  return isReady ? (
    <Box
      component="span"
      className={`fi fi-${alpha2.toLowerCase()}`}
      sx={{
        width: size,
        height: size * 0.75,
        display: 'inline-block',
        borderRadius: '2.286px',
        border: '1px solid #E1E2EA',
        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
        ...sx, // ⬅️ Se permite personalización
      }}
    />
  ) : (
    <Skeleton variant="rectangular" width={size} height={size * 0.75} sx={{ borderRadius: 1, ...sx }} />
  )
}

export default CountryFlag
