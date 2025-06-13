import { useRouter } from 'next/router'
import {
  SidebarListItemCounter,
  SidebarListItemText,
  SidebarListItemButton as DefaultSidebarListItemButton,
  SidebarListItemText as DefaultSidebarListItemText,
  SidebarListItemCounter as DefaultSidebarListItemCounter,
} from '..'
import { Badge, ListItemButton, ListItemButtonProps, ListItemIcon, ListItemIconProps } from '@mui/material'
import Link, { LinkProps } from 'next/link'
import { ReactElement } from 'react'
import Shiny from '@/public/images/common/shiny-animation.svg'
import css from './styles.module.css'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useQuery } from '@tanstack/react-query'
import { checkAirdropEligibility } from '@/services/airdrop'

const getSubdirectory = (pathname: string): string => {
  return pathname.split('/')[1]
}

export const SidebarListItemButton = ({
  href,
  children,
  ...rest
}: Omit<ListItemButtonProps, 'sx'> & { href?: LinkProps['href'] }): ReactElement => {
  const button = (
    <ListItemButton className={css.listItemButton} {...rest}>
      {children}
    </ListItemButton>
  )

  return href ? (
    <Link href={href} passHref legacyBehavior>
      {button}
    </Link>
  ) : (
    button
  )
}

const SidebarListItemIcon = ({
  children,
  badge = false,
  color = '#000000',
  stroke = '#FCFF52',
  ...rest
}: Omit<ListItemIconProps, 'className'> & { badge?: boolean; stroke?: string }): ReactElement => (
  <ListItemIcon
    className={css.icon}
    sx={{
      '& svg': {
        width: '16px',
        height: '16px',
        '& path': {
          fill: color,
          stroke,
        },
      },
    }}
    {...rest}
  >
    <Badge color="error" variant="dot" invisible={!badge} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      {children}
    </Badge>
  </ListItemIcon>
)

export const SidebarAirdropComponent = ({ item }: { item: any }) => {
  const router = useRouter()
  const safeAddress = useSafeAddress()

  const { data: airdropData, isLoading: isCheckLoading } = useQuery({
    queryKey: ['check-airdrop', safeAddress],
    queryFn: () => checkAirdropEligibility(safeAddress),
    enabled: !!safeAddress,
  })

  const currentSubdirectory = getSubdirectory(router.pathname)
  const getRoute = (href: string) => {
    return href
  }

  const isSelected = currentSubdirectory === getSubdirectory(item.href)

  if (!airdropData?.eligible || isCheckLoading) return null
  return (
    <>
      {airdropData?.eligible && !airdropData?.claimed ? (
        <SidebarListItemButton
          selected={isSelected}
          href={{ pathname: getRoute(item.href), query: { safe: router.query.safe } }}
        >
          <Shiny className={css.shine} />
          {item.icon && <SidebarListItemIcon badge={false}>{item.icon}</SidebarListItemIcon>}

          <SidebarListItemText data-testid="sidebar-list-item" bold>
            {item.label}

            <SidebarListItemCounter count="" />
          </SidebarListItemText>
        </SidebarListItemButton>
      ) : (
        <DefaultSidebarListItemButton
          selected={isSelected}
          href={{ pathname: getRoute(item.href), query: { safe: router.query.safe } }}
        >
          {item.icon && (
            <SidebarListItemIcon badge={false} color="#000000" stroke="#FCFF52">
              {item.icon}
            </SidebarListItemIcon>
          )}

          <DefaultSidebarListItemText data-testid="sidebar-list-item" bold>
            {item.label}

            <DefaultSidebarListItemCounter count="" />
          </DefaultSidebarListItemText>
        </DefaultSidebarListItemButton>
      )}
    </>
  )
}
