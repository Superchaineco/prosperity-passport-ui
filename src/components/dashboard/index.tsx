import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect, type ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Grid } from '@mui/material'
// import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import Overview from '@/components/dashboard/Overview/Overview'
// import { FeaturedApps } from '@/components/dashboard/FeaturedApps/FeaturedApps'
// import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
// import GovernanceSection from '@/components/dashboard/GovernanceSection/GovernanceSection'
import CreationDialog from '@/components/dashboard/CreationDialog'
import { useRouter } from 'next/router'
import { CREATION_MODAL_QUERY_PARAM } from '../new-safe/create/logic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import Balances from '@/pages/_balances'
import SuperChainEOAS from '../common/SuperChainEOAS'
import SafeAppsDashboardSection from './SafeAppsDashboardSection/SafeAppsDashboardSection'
import EOAAddedModal from './EOAAddedModal'
import { ADD_OWNER_MODAL_QUERY_PARAM } from '../accept-invite/alert-modal'
import useWallet from '@/hooks/wallets/useWallet'

import WrongNetworkModal from './WrongNetworkModal'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useAppSelector } from '@/store'
import { selectUndeployedSafe } from '@/store/slices'
import ActivatingSuperAccount from './ActivatingSuperAccount'
const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))

const Dashboard = (): ReactElement => {
  const router = useRouter()
  const wallet = useWallet()

  const { safe, safeLoaded, safeLoading, safeAddress } = useSafeInfo()
  const { [CREATION_MODAL_QUERY_PARAM]: showCreationModal = '' } = router.query
  const { [ADD_OWNER_MODAL_QUERY_PARAM]: showEOAAddedModal = '' } = router.query
  const isWrongChain = useIsWrongChain()
  const supportsRecovery = useIsRecoverySupported()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))

  const isActivating = !!undeployedSafe
  useEffect(() => {
    if (!safeLoaded || safeLoading) return
    if (!wallet) {
      router.push('/')
    } else {
      const isOwner = safe.owners.find((owner) => owner.value.toLowerCase() == wallet?.address.toLowerCase())
      if (!isOwner) {
        router.push('/')
      }
    }
  }, [wallet])

  if (isActivating) return <ActivatingSuperAccount />

  return (
    <>
      <Grid container spacing={3} rowSpacing={5}>
        {supportsRecovery && <RecoveryHeader />}

        <Grid item xs={12}>
          <Overview />
        </Grid>

        <Grid item xs={12}>
          <FirstSteps />
        </Grid>

        {safe.deployed && (
          <>
            <Grid item xs={12} lg={8}>
              <Balances />
            </Grid>

            <Grid item xs={12} lg={4}>
              <SuperChainEOAS />
            </Grid>
            <Grid item xs={12}>
              <SafeAppsDashboardSection />
            </Grid>
          </>
        )}
      </Grid>
      {showCreationModal ? <CreationDialog /> : null}
      {showEOAAddedModal ? <EOAAddedModal /> : null}
      {isWrongChain && <WrongNetworkModal />}
    </>
  )
}

export default Dashboard
