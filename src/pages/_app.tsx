import { SentryErrorBoundary } from '@/services/sentry' // needs to be imported first
import useRehydrateSocialWallet from '@/hooks/wallets/mpc/useRehydrateSocialWallet'
import PasswordRecoveryModal from '@/services/mpc/PasswordRecoveryModal'
import type { ReactNode } from 'react'
import { type ReactElement } from 'react'
import { type AppProps } from 'next/app'
import Head from 'next/head'
import { Provider } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import '@/styles/globals.css'
import { IS_PRODUCTION, GATEWAY_URL_STAGING, GATEWAY_URL_PRODUCTION } from '@/config/constants'
import { makeStore, useHydrateStore } from '@/store'
import PageLayout from '@/components/common/PageLayout'
import useLoadableStores from '@/hooks/useLoadableStores'
import { useInitOnboard } from '@/hooks/wallets/useOnboard'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'
import useTxNotifications from '@/hooks/useTxNotifications'
import useSafeNotifications from '@/hooks/useSafeNotifications'
import useTxPendingStatuses from '@/hooks/useTxPendingStatuses'
import { useInitSession } from '@/hooks/useInitSession'
import Notifications from '@/components/common/Notifications'
import { cgwDebugStorage } from '@/components/sidebar/DebugToggle'
import { useTxTracking } from '@/hooks/useTxTracking'
import { useSafeMsgTracking } from '@/hooks/messages/useSafeMsgTracking'
import useGtm from '@/services/analytics/useGtm'
import useBeamer from '@/hooks/Beamer/useBeamer'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import createEmotionCache from '@/utils/createEmotionCache'
import MetaTags from '@/components/common/MetaTags'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useSafeMessageNotifications from '@/hooks/messages/useSafeMessageNotifications'
import useSafeMessagePendingStatuses from '@/hooks/messages/useSafeMessagePendingStatuses'
import useChangedValue from '@/hooks/useChangedValue'
import { TxModalProvider } from '@/components/tx-flow'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import Recovery from '@/features/recovery/components/Recovery'
import WalletProvider from '@/components/common/WalletProvider'
import CounterfactualHooks from '@/features/counterfactual/CounterfactualHooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { SUBGRAPH_URL } from '@/features/superChain/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import { createAppKit } from '@reown/appkit/react'
import { AppKitNetwork, celo } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { createSIWE } from '@/services/siwe'
import { WC_PROJECT_ID as projectId } from '@/config/constants'

const metadata = {
  name: 'Prosperity Account',
  description:
    'Earn rewards for your Prosperity Account contributions with Prosperity Account Accounts. Track badges, manage transactions, and view your Prosperity Account. Get recognized for your participation.',
  url: 'https://account.celopg.eco',
  icons: ['https://account.celopg.eco/images/pp-logo.png'],
}
if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const chains: [AppKitNetwork, ...AppKitNetwork[]] = [celo]
const siweConfig = createSIWE(chains)

createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: chains,
  projectId,
  siweConfig,

  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  allowUnsupportedChain: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 1300,
    '--w3m-color-mix': '#476520',
    '--w3m-accent': '#476520',
    '--w3m-border-radius-master': '0px',
  },
})

const GATEWAY_URL = IS_PRODUCTION || cgwDebugStorage.get() ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

const reduxStore = makeStore()

const InitApp = (): null => {
  // setGatewayBaseUrl(GATEWAY_URL)
  useHydrateStore(reduxStore)
  useAdjustUrl()
  useGtm()
  useNotificationTracking()
  useInitSession()
  useLoadableStores()
  useInitOnboard()
  useInitWeb3()
  useInitSafeCoreSDK()
  useTxNotifications()
  useSafeMessageNotifications()
  useSafeNotifications()
  useTxPendingStatuses()
  useSafeMessagePendingStatuses()
  useTxTracking()
  useSafeMsgTracking()
  useBeamer()
  useRehydrateSocialWallet()

  return null
}

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()
const queryClient = new QueryClient()

export const AppProviders = ({ children }: { children: ReactNode | ReactNode[] }) => {
  const isDarkMode = useDarkMode()
  const themeMode = 'light'
  const client = new ApolloClient({
    uri: SUBGRAPH_URL,
    cache: new InMemoryCache(),
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ApolloProvider client={client}>
        <SafeThemeProvider mode={themeMode}>
          {(safeTheme: Theme) => (
            <ThemeProvider theme={safeTheme}>
              <SentryErrorBoundary showDialog fallback={ErrorBoundary}>
                <WalletProvider>
                  <TxModalProvider>{children}</TxModalProvider>
                </WalletProvider>
              </SentryErrorBoundary>
            </ThemeProvider>
          )}
        </SafeThemeProvider>
      </ApolloProvider>
    </QueryClientProvider>
  )
}

interface WebCoreAppProps extends AppProps {
  emotionCache?: EmotionCache
}

const WebCoreApp = ({
  Component,
  pageProps,
  router,
  emotionCache = clientSideEmotionCache,
}: WebCoreAppProps): ReactElement => {
  const safeKey = useChangedValue(router.query.safe?.toString())

  return (
    <Provider store={reduxStore}>
      <Head>
        <title key="default-title">Prosperity Account</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </Head>

      <CacheProvider value={emotionCache}>
        <AppProviders>
          <CssBaseline />

          <InitApp />

          <PageLayout pathname={router.pathname}>
            <Component {...pageProps} key={safeKey} />
          </PageLayout>

          {/* <CookieBanner /> */}

          <Notifications />

          <PasswordRecoveryModal />

          <Recovery />

          <CounterfactualHooks />
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}

export default WebCoreApp
