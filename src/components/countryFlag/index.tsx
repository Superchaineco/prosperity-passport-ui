import countries from 'i18n-iso-countries'
import 'i18n-iso-countries/langs/en.json'
import React from 'react'

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

type Props = {
  alpha3: string
  size?: number
}

const CountryFlag: React.FC<Props> = ({ alpha3, size = 48 }) => {
  const alpha2 = countries.alpha3ToAlpha2(alpha3.toUpperCase())
  if (!alpha2) return <span title="Unknown country">🏳️</span>

  return (
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
  )
}

export default CountryFlag
