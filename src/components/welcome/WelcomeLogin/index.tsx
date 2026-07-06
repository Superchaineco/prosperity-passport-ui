import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Box, Button, Stack } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import useWallet from '@/hooks/wallets/useWallet'
import { useCallback, useEffect, useState } from 'react'
import useCurrentWalletHasSuperChainSmartAccount from '@/hooks/super-chain/useCurrentWalletHasSuperChainSmartAccount'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
const WelcomeLogin = () => {
  const router = useRouter()
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()
  const wallet = useWallet()
  const { hasSuperChainSmartAccount, superChainSmartAccount, isLoading, refetch, isRefetching } =
    useCurrentWalletHasSuperChainSmartAccount()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const onLogin = useCallback(async () => {
    setShouldRedirect(true)
  }, [])

  const handleConnect = async () => {
    if (wallet) {
      await onLogin()
    } else {
      open()
      await onLogin()
    }
  }

  useEffect(() => {
    if (!shouldRedirect || !isConnected || isRefetching || isLoading || !wallet) return
    ;(async () => {
      await refetch()

      const destination = hasSuperChainSmartAccount
        ? { pathname: AppRoutes.home, query: { safe: superChainSmartAccount } }
        : null

      if (destination) {
        router.push(destination)
      }
      setShouldRedirect(false)
    })()
  }, [hasSuperChainSmartAccount, isLoading, router, isConnected, shouldRedirect, isRefetching, wallet])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login">
      <Box className={css.loginContent}>
        <Box className={css.loginContent}>
          <Typography variant="h6" mt={6} fontWeight={700}>
            Welcome
          </Typography>

          <Typography mb={2} textAlign="center">
            Log In to open your Prosperity Pass
          </Typography>
          <Stack direction="row" gap={2}>
            <Button
              onClick={handleConnect}
              variant="contained"
              color="complementary"
              disableElevation
              sx={{ fontSize: '16px', height: '42px', width: '204px' }}
            >
              Get started
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
