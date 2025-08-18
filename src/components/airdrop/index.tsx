import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  Portal,
  Skeleton,
  SvgIcon,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { airdropClaimed, checkAirdropEligibility } from '@/services/airdrop'
import BeautySuccess from '@/public/images/common/beauty-success.svg'
import CeloIcon from '@/public/tokens/celo.svg'
import useSafeAddress from '@/hooks/useSafeAddress'
import { Address, createWalletClient, custom, formatUnits, getContract } from 'viem'
import StarsAnimation from '../badges/modals/StarsAnimation'
import { AIRDROP_ABI, AIRDROP_ADDRESS } from '@/features/superChain/constants'
import { celo } from 'viem/chains'
import useWallet from '@/hooks/wallets/useWallet'
import { EthereumProvider } from 'permissionless/utils/toOwner'
import usePimlico from '@/hooks/usePimlico'
import { publicClient } from '@/services/pimlico'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined'
import router from 'next/router'
import { AppRoutes } from '@/config/routes'
import RefreshTimer from '../leaderboard/RefreshTimer'
import ClaimCompletedDialog from './ClaimCompleted'

function Claim() {
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const { smartAccountClient } = usePimlico()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isShowStars, setIsShowStars] = useState(false)
  const [isClaimedOpen, setIsClaimedOpen] = useState(false)
  const [claimHash, setclaimHash] = useState('')

  const {
    data: airdropData,
    isLoading: isCheckLoading,
    refetch: refetchAirdrop,
  } = useQuery({
    queryKey: ['check-airdrop', safeAddress],
    queryFn: () => checkAirdropEligibility(safeAddress),
    enabled: !!safeAddress,
  })

  const expireDate = new Date(airdropData?.expiration_date || '0')
  const formattedExpireDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(expireDate)

  const handleStakeClick = () => {
    router.push({ pathname: AppRoutes.vaults.index, query: { safe: router.query.safe, vaults: 'celo' } })
  }
  const handleClaimClick = async () => {
    if (isClaiming) return
    setIsClaiming(true)
    setIsShowStars(false)

    try {
      if (!smartAccountClient) return
      // TODO: remove this when we are ready to use smart accounts
      const walletClient = createWalletClient({
        chain: celo,
        transport: custom(wallet?.provider as EthereumProvider),
        account: wallet?.address as Address,
      })
      const airdropContract = getContract({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        client: {
          public: publicClient,
          wallet: walletClient,
        },
      })
      const hash = await airdropContract.write.claimERC20([
        '0x471EcE3750Da237f93B8E339c536989b8978a438' as Address,
        safeAddress as Address,
        airdropData?.value,
        airdropData?.proofs,
      ])
      await publicClient.waitForTransactionReceipt({ hash: hash! })
      await airdropClaimed(safeAddress, hash!)
      setclaimHash(hash)
      await refetchAirdrop()
      setIsClaiming(false)
      setIsShowStars(true)
      setIsClaimedOpen(true)
    } catch (error) {
      setIsClaiming(false)
      console.error('Error claiming tokens:', error)
    }
  }

  const handleAddTokenToWallet = async () => {
    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(wallet?.provider as EthereumProvider),
    })
    try {
      await walletClient.watchAsset({
        type: 'ERC20',
        options: {
          address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
          decimals: 18,
          symbol: 'CELO',
          image: 'https://pass.celopg.eco/tokens/celo.svg',
        },
      })
    } catch (error) {
      console.error('Error adding token to wallet:', error)
    }
  }

  if (isCheckLoading) {
    return (
      <Grid container gap="24px" paddingY="72px" paddingX="120px">
        <Typography variant="h1" fontSize={24} fontWeight={600}>
          Celo Community Claim
        </Typography>
        <Grid item xs={12}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ marginTop: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ marginTop: 2 }} />
        </Grid>
      </Grid>
    )
  }
  return (
    <Grid
      container
      gap="24px"
      sx={{
        paddingY: { xs: 6, lg: '72px' },
        paddingX: { xs: 3, lg: '120px' },
      }}
    >
      {isShowStars && (
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1300,
            }}
          >
            <StarsAnimation />
          </Box>
        </Portal>
      )}
      <Typography variant="h1" fontSize={24} fontWeight={600}>
        Celo Community Claim #1
      </Typography>
      <RefreshTimer message="Ends in " deadLine={expireDate} />

      {!airdropData?.eligible && (
        <>
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              borderRadius: '6px',
              gap: '16px',
              padding: '24px',
            }}
          >
            <Typography variant="h4" fontSize={20} fontWeight={600}>
              Oops! It looks like you&apos;re not eligible for this airdrop.
            </Typography>
            <Typography fontSize={16} fontWeight={400} variant="body2" color="textSecondary">
              You don&apos;t currently meet the eligibility criteria for Celo Community Claim #1. Stay tuned for future
              opportunities to earn rewards!
            </Typography>
          </Grid>
        </>
      )}
      {airdropData?.eligible && (
        <>
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              borderRadius: '6px',
              gap: '16px',
              padding: '24px',
            }}
          >
            <Typography variant="h4" fontSize={20} fontWeight={600}>
              {airdropData?.claimed
                ? 'Congrats! You have claimed your Airdrop'
                : 'Congrats! You are eligible for the airdrop'}
            </Typography>
            <Typography fontSize={16} fontWeight={400} variant="body2" color="textSecondary">
              You’ve successfully completed the required activities and are eligible to claim your reward for Celo
              Community Claim #1.
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '24px',
            }}
          >
            <Box display="flex" flexDirection="column" gap="8px">
              <Typography fontSize="16px" fontWeight={400}>
                {airdropData?.claimed ? 'You have already claimed:' : 'You will receive:'}
              </Typography>
              <Box display="flex" fontSize="30px" flexDirection="row" alignItems="center" gap="8px">
                <Typography fontSize="24px" fontWeight={600}>
                  {formatUnits(BigInt(airdropData?.value), 18)}
                </Typography>
                <SvgIcon component={CeloIcon} inheritViewBox fontSize="inherit" />
              </Box>
            </Box>
            <Button
              disabled={airdropData?.claimed}
              sx={{
                backgroundColor: '#476520',
                color: 'white',
                height: '48px',
                padding: '0 16px',
                marginY: 'auto',
              }}
              variant="contained"
              onClick={handleClaimClick}
            >
              {isClaiming ? (
                <Box display="flex" gap={1} alignItems="center">
                  Claiming CELO Tokens
                  <CircularProgress color="inherit" size={24} />
                </Box>
              ) : (
                'Claim CELO Tokens'
              )}
            </Button>
          </Grid>
          {airdropData?.claimed && (
            <Grid item xs={12} sx={{ backgroundColor: 'white', p: 2, borderRadius: 2, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontSize={20} fontWeight={600}>
                    Make your CELO work for you
                  </Typography>

                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ px: 0 }}>
                      <Box fontSize="24px" display="flex" gap={1} alignItems="center">
                        <SvgIcon component={TrendingUpIcon} inheritViewBox fontSize="inherit" />
                        <Typography fontSize="16px" fontWeight={400}>
                          Earn 1.8% yield APR
                        </Typography>
                      </Box>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Box fontSize="24px" display="flex" gap={1} alignItems="center">
                        <SvgIcon component={NewReleasesOutlinedIcon} inheritViewBox fontSize="inherit" />
                        <Typography fontSize="16px" fontWeight={400}>
                          Contributes toward unlocking the Staker Badge
                        </Typography>
                      </Box>
                    </ListItem>
                  </List>
                </Box>

                <Box
                  sx={{
                    ml: { sm: 'auto' },
                    alignSelf: { sm: 'stretch' }, // ocupa la altura del bloque
                    display: 'flex',
                    alignItems: 'center', // centra verticalmente
                    justifyContent: 'flex-end', // pegado a la derecha
                  }}
                >
                  <Button sx={{ backgroundColor: '#476520' }} variant="contained" onClick={handleStakeClick}>
                    Stake CELO
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}
          {!airdropData?.claimed && (
            <>
              <Grid item xs={12} sx={{ backgroundColor: 'white', padding: 2, borderRadius: 2, marginBottom: 2 }}>
                <Typography variant="h4" fontSize={20} fontWeight={600}>
                  Your Activities
                </Typography>
                <List>
                  {airdropData?.reasons.map((reason, index) => (
                    <ListItem key={index}>
                      <Box fontSize="24px" display="flex" gap={1} alignItems="center">
                        <SvgIcon component={BeautySuccess} inheritViewBox fontSize="inherit" />
                        <Typography fontSize="16px" fontWeight={400}>
                          {reason}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  You must claim your tokens before {formattedExpireDate}. They&apos;ll expire after this date.
                </Alert>
              </Grid>
            </>
          )}

          <ClaimCompletedDialog
            open={isClaimedOpen}
            onClose={() => setIsClaimedOpen(false)}
            symbol="CELO"
            icon={CeloIcon}
            amount={formatUnits(BigInt(airdropData?.value), 18)}
            amountUsd={formatUnits(BigInt(airdropData?.value), 18)}
            txHash={claimHash as Address}
            onContinue={() => {
              setIsClaimedOpen(false)
              handleStakeClick()
            }}
          />
        </>
      )}
    </Grid>
  )
}

export default Claim
