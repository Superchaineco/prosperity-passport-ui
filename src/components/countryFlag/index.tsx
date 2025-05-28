import countries from 'i18n-iso-countries'
import 'i18n-iso-countries/langs/en.json'
import React, { useEffect, useState } from 'react'
import 'flag-icons/css/flag-icons.min.css'
import Skeleton from '@mui/material/Skeleton'

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

type Props = {
  alpha3: string
  size?: number
}

const CountryFlag: React.FC<Props> = ({ alpha3, size = 100 }) => {
  const alpha2 = countries.alpha3ToAlpha2(alpha3.toUpperCase())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Simulamos que la bandera carga tras un frame
    const timeout = requestAnimationFrame(() => setIsReady(true))
    return () => cancelAnimationFrame(timeout)
  }, [])

  if (!alpha2) {
    return <Skeleton variant="rectangular" width={size} height={size * 0.75} sx={{ borderRadius: 1 }} />
  }

  return isReady ? (
    <span
      className={`fi fi-${alpha2.toLowerCase()}`}
      style={{
        width: size,
        height: size * 0.75,
        display: 'inline-block',
        borderRadius: 6,
        boxShadow: '0 0 2px rgba(0,0,0,0.3)',
      }}
    />
  ) : (
    <Skeleton variant="rectangular" width={size} height={size * 0.75} sx={{ borderRadius: 1 }} />
  )
}

export default CountryFlag
