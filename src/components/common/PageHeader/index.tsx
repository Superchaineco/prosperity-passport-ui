import { Box, Typography } from '@mui/material'
import classNames from 'classnames'

import type { ReactElement } from 'react'

import css from './styles.module.css'

const PageHeader = ({
  title,
  action,
  noBorder,
}: {
  title: string | ReactElement
  action?: ReactElement
  noBorder?: boolean
}): ReactElement => {
  return (
    <Box className={classNames(css.container, { [css.border]: !noBorder })}>
      <Typography variant="h3" className={css.title}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}

export default PageHeader
