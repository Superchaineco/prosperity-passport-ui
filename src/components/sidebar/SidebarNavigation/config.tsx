import type { ReactElement, ReactNode } from 'react'
import React from 'react'
import { AppRoutes } from '@/config/routes'
import AccountIcon from '@/public/images/sidebar/account.svg'
import BadgesIcon from '@/public/images/sidebar/badges.svg'
import LeaderboardIcon from '@/public/images/sidebar/leaderboard.svg'
import ContactsIcon from '@/public/images/sidebar/contacts.svg'
import TransactionIcon from '@/public/images/sidebar/transactions.svg'
import Encrypted from '@/public/images/vaults/encrypted.svg'
import { SvgIcon } from '@mui/material'
import { SidebarAirdropComponent } from '../SidebarList/Airdrop'
import Celo from '@/public/tokens/celo.svg'

export type NavItem = {
  label: string
  icon?: ReactElement
  href: string
  customComponent?: ReactNode
}

export const navItems: NavItem[] = [
  {
    label: 'Account',
    icon: <SvgIcon component={AccountIcon} inheritViewBox />,
    href: AppRoutes.home,
  },
  {
    label: 'Vaults',
    icon: <SvgIcon component={Encrypted} inheritViewBox />,
    href: AppRoutes.vaults.index,
  },

  {
    label: 'Badges',
    icon: <SvgIcon component={BadgesIcon} inheritViewBox />,
    href: AppRoutes.badges.allTime,
  },
  {
    label: 'Leaderboard',
    icon: <SvgIcon component={LeaderboardIcon} inheritViewBox />,
    href: AppRoutes.leaderboard.index,
  },
  // {
  //   label: 'Assets',
  //   icon: <SvgIcon component={AssetsIcon} inheritViewBox />,
  //   href: AppRoutes.balances.index,
  // },
  {
    label: 'Contacts',
    icon: <SvgIcon component={ContactsIcon} inheritViewBox />,
    href: AppRoutes.contacts,
  },
  {
    label: 'Transactions',
    icon: <SvgIcon component={TransactionIcon} inheritViewBox />,
    href: AppRoutes.transactions.history,
  },
  {
    label: 'Claim Celo',
    icon: <SvgIcon component={Celo} inheritViewBox />,
    href: AppRoutes.airdrop,
    customComponent: (
      <SidebarAirdropComponent
        item={{
          label: 'Claim Celo',
          icon: <SvgIcon component={Celo} inheritViewBox />,
          href: AppRoutes.airdrop,
        }}
      />
    ),
  },

  // {
  //   label: 'Apps',
  //   icon: <SvgIcon component={AppsIcon} inheritViewBox />,
  //   href: AppRoutes.apps.index,
  // },
  // {
  //   label: 'Settings',
  //   icon: <SvgIcon data-testid="settings-nav-icon" component={SettingsIcon} inheritViewBox />,
  //   href: AppRoutes.settings.setup,
  // },
]

export const transactionNavItems = [
  {
    label: 'Queue',
    href: AppRoutes.transactions.queue,
  },
  {
    label: 'History',
    href: AppRoutes.transactions.history,
  },
  {
    label: 'Messages',
    href: AppRoutes.transactions.messages,
  },
]

export const balancesNavItems = [
  {
    label: 'Tokens',
    href: AppRoutes.balances.index,
  },
  {
    label: 'NFTs',
    href: AppRoutes.balances.nfts,
  },
]

export const settingsNavItems = [
  {
    label: 'Setup',
    href: AppRoutes.settings.setup,
  },
  {
    label: 'Appearance',
    href: AppRoutes.settings.appearance,
  },
  {
    label: 'Security & Login',
    href: AppRoutes.settings.securityLogin,
  },
  {
    label: 'Notifications',
    href: AppRoutes.settings.notifications,
  },
  {
    label: 'Modules',
    href: AppRoutes.settings.modules,
  },
  {
    label: 'Safe Apps',
    href: AppRoutes.settings.safeApps.index,
  },
  {
    label: 'Data',
    href: AppRoutes.settings.data,
  },
  {
    label: 'Environment variables',
    href: AppRoutes.settings.environmentVariables,
  },
]

export const leaderboardNavItems = [
  {
    label: 'All-Time',
    href: AppRoutes.leaderboard.index,
  },
  {
    label: 'Season 7',
    href: AppRoutes.leaderboard.index,
  },
]

export const generalSettingsNavItems = [
  {
    label: 'Cookies',
    href: AppRoutes.settings.cookies,
  },
  {
    label: 'Appearance',
    href: AppRoutes.settings.appearance,
  },
  {
    label: 'Notifications',
    href: AppRoutes.settings.notifications,
  },
  {
    label: 'Security & Login',
    href: AppRoutes.settings.securityLogin,
  },
  {
    label: 'Data',
    href: AppRoutes.settings.data,
  },
  {
    label: 'Environment variables',
    href: AppRoutes.settings.environmentVariables,
  },
]

export const safeAppsNavItems = [
  {
    label: 'All apps',
    href: AppRoutes.apps.index,
  },
  {
    label: 'My custom apps',
    href: AppRoutes.apps.custom,
  },
]
