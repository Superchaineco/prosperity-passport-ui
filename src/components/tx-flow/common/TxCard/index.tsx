import type { ReactNode } from 'react'
import { Card, CardContent } from '@mui/material'
import css from '../styles.module.css'

const sx = { my: 2, border: 0 }

const TxCard = ({ children }: { children: ReactNode }) => {
  return (
    <Card variant="outlined" sx={sx}>
      <CardContent className={css.cardContent}>{children}</CardContent>
    </Card>
  )
}

export default TxCard
