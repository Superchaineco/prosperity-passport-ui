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
import { checkAirdropEligibility } from '@/services/airdrop'
import BeautySuccess from '@/public/images/common/beauty-success.svg'
import Celo from '@/public/tokens/celo.svg'
import useSafeAddress from '@/hooks/useSafeAddress'
import { Address, createWalletClient, custom, formatUnits, getContract } from 'viem'
import StarsAnimation from '../badges/modals/StarsAnimation'
import { CHAIN_ID, AIRDROP_ABI, AIRDROP_ADDRESS } from '@/features/superChain/constants'
import { sepolia, optimism } from 'viem/chains'
import useWallet from '@/hooks/wallets/useWallet'
import { EthereumProvider } from 'permissionless/utils/toOwner'
import usePimlico from '@/hooks/usePimlico'
import { publicClient } from '@/services/pimlico'

function Claim() {
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const { smartAccountClient } = usePimlico()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isShowStars, setIsShowStars] = useState(false)

  const {
    data: airdropData,
    isLoading: isCheckLoading,
    refetch: refetchAirdrop,
  } = useQuery({
    queryKey: ['check-airdrop', safeAddress],
    queryFn: () => checkAirdropEligibility(safeAddress),
    enabled: !!safeAddress,
  })

  const handleClaimClick = async () => {
    if (isClaiming) return
    setIsClaiming(true)
    setIsShowStars(false)
    try {
      if (!smartAccountClient) return
      // TODO: remove this when we are ready to use smart accounts
      const walletClient = createWalletClient({
        chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
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
      await refetchAirdrop()
      setIsClaiming(false)
      setIsShowStars(true)
    } catch (error) {
      console.error('Error claiming tokens:', error)
    }
  }

  const handleAddTokenToWallet = async () => {
    const walletClient = createWalletClient({
      chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
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
          SUNNY Community Claim #1
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
              gap: '16px',
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
                <SvgIcon component={Celo} inheritViewBox fontSize="inherit" />
              </Box>
            </Box>
            {airdropData.claimed ? (
              <Button variant="outlined" onClick={handleAddTokenToWallet}>
                Add to Wallet
              </Button>
            ) : (
              <Button variant="contained" color="secondary" onClick={handleClaimClick}>
                {isClaiming ? (
                  <Box display="flex" gap={1} alignItems="center">
                    Claiming CELO Tokens
                    <CircularProgress color="inherit" size={24} />
                  </Box>
                ) : (
                  'Claim CELO Tokens'
                )}
              </Button>
            )}
          </Grid>
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
          {!airdropData?.claimed && (
            <Grid item xs={12}>
              <Alert severity="warning">Token Claim #1 is available until February 12, 2025.</Alert>
            </Grid>
          )}
        </>
      )}
    </Grid>
  )
}

export default Claim
