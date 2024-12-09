import React from 'react'
import { Grid, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
import Badge from '@/public/images/common/badges.svg'
import LevelUp from '@/public/images/common/level-up.svg'
import Leaderboard from '@/public/images/common/leaderboard.svg'
import Transactions from '@/public/images/common/transactions.svg'
import CardFooter from '@/public/images/common/footer-card.svg'

import WelcomeLogin from './WelcomeLogin'

const BulletListItem = ({ text, icon }: { text: string; icon: any }) => (
  <li>
    <SvgIcon className={css.checkIcon} component={icon} inheritViewBox />
    <Typography color="static.secondary" fontWeight={700}>
      {text}
    </Typography>
  </li>
)

const NewSafe = () => {
  return (
    <>
      <Grid container spacing={3} p={3} pb={0} flex={1} direction="row-reverse">
        <Grid item xs={12} lg={6}>
          <WelcomeLogin />
        </Grid>
        <Grid item xs={12} lg={6} flex={1}>
          <div className={css.content}>
            <SvgIcon
              component={CardFooter}
              inheritViewBox
              style={{
                minWidth: '100%',
                width: 'auto',
                height: '211px',
                position: 'absolute',
                zIndex: 0,
                bottom: 0,
                right: 0,
              }}
            />
            <Typography fontSize={56} fontFamily="GT Alpina" lineHeight={1} color="static.secondary">
              Feel the power of the{' '}
              <Typography
                component="span"
                fontSize="inherit"
                lineHeight="inherit"
                letterSpacing="inherit"
                color="inherit"
                fontFamily="GT Alpina Condensed"
              >
                Prosperity Passport
              </Typography>
            </Typography>

            <Typography mb={1} color="static.secondary">
              Connect to the Celo ecosystem with your Smart Account.
            </Typography>

            <ul className={css.bulletList}>
              <BulletListItem text="Earn badges" icon={Badge} />
              <BulletListItem text="Level Up" icon={LevelUp} />
              <BulletListItem text="Climb the leaderboard" icon={Leaderboard} />
              <BulletListItem text="Unlock transaction perks" icon={Transactions} />
            </ul>
          </div>
        </Grid>
      </Grid>
    </>
  )
}

export default NewSafe
