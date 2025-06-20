import { useEffect, type ReactElement } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import AccountCenter from '@/components/common/ConnectWallet/AccountCenter'
import ConnectionCenter from './ConnectionCenter'
import router from 'next/router'
import { AppRoutes } from '@/config/routes'

const ConnectWallet = (): ReactElement => {
  const wallet = useWallet()

  useEffect(() => {
    ;(async () => {
      if (!wallet && router.pathname == AppRoutes.newSafe.create)
        router.push({ pathname: AppRoutes.welcome.index, query: router.query })
    })()
  }, [wallet])
  return wallet ? <AccountCenter wallet={wallet} /> : <ConnectionCenter />
}

export default ConnectWallet
