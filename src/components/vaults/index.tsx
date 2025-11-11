import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Skeleton,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import cUSD from '@/public/images/currencies/cUSD.svg'
import cEUR from '@/public/images/currencies/cEUR.svg'
import CELO from '@/public/images/currencies/celo.svg'
import wETH from '@/public/images/currencies/ethereum.svg'
import USDT from '@/public/images/currencies/usdt.svg'
import Coinmarket from '@/public/images/vaults/protocols/Coinmarket.svg'
import Celo from '@/public/images/vaults/protocols/celo.svg'
import { useQuery } from '@tanstack/react-query'
import { BACKEND_BASE_URI } from '@/config/constants'
import axios from 'axios'
import useSafeAddress from '@/hooks/useSafeAddress'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { Address } from 'viem'
import SuccessModal from './SuccessModal'
import Image from 'next/image'
import ErrorModal from './ErrorModal'
import useBalances from '@/hooks/useBalances'

interface Vault {
  reserve?: string
  asset: string
  symbol: string
  name?: string
  decimals: number
  image: string | null
  interest_apr?: string | number
  rewards_apr?: string | number
  asset_price?: number
  apr?: string | number
  balance?: string | number
  raw_balance?: string
  supply_balance?: string | number
  depreciated?: boolean
  min_deposit?: string | number
  _strategy?: string
}

function VaultCard({
  title,
  value,
  rawValue,
  apy,
  icon,
  tokenAddress,
  balanceSymbol,
  strategy,
  depreciated = false,
  minDepositAmount = '100',
  decimals = 6,
  withdrawMaxAmount,
  withdrawRatio,
  vault,
}: {
  title: string
  value: number
  rawValue: string
  apy: number
  icon: any
  tokenAddress: string
  balanceSymbol: string
  strategy: string
  depreciated?: boolean
  minDepositAmount?: string
  decimals: number
  withdrawMaxAmount?: number
  withdrawRatio?: number
  vault?: Vault
}) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isUrlOpened, setIsUrlOpened] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [newBalance, setNewBalance] = useState(value.toString())
  const [maxAmount, setMaxAmount] = useState(value)
  const [lastOperationType, setLastOperationType] = useState<'deposit' | 'withdraw'>('deposit')

  const handleOpenDepositModal = () => {
    setIsDepositModalOpen(true)
  }

  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false)
  }

  const handleOpenWithdrawModal = () => {
    setIsWithdrawModalOpen(true)
  }

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false)
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setAmount('')
    setTxHash('')
  }

  const handleCloseShowError = () => {
    setShowError(false)
    setIsWithdrawModalOpen(false)
    setIsDepositModalOpen(false)
    setAmount('')
    setTxHash('')
  }

  const handleTryAgain = (type: 'deposit' | 'withdraw') => {
    setAmount('')
    setTxHash('')
    setShowError(false)
    if (type === 'deposit') {
      setIsDepositModalOpen(false)
      setIsDepositModalOpen(true)
    } else {
      setIsWithdrawModalOpen(false)
      setIsWithdrawModalOpen(true)
    }
  }

  const handleDepositSuccess = (amount: string, hash: string, balance: string) => {
    setAmount(amount)
    setTxHash(hash)
    setNewBalance(balance)
    setMaxAmount(Number(balance))
    setLastOperationType('deposit')
    setShowSuccess(true)
    setIsDepositModalOpen(false)
  }

  const handleWithdrawSuccess = (amount: string, hash: string, balance: string) => {
    // amount es en stCELO cuando strategy === 'stcelo'
    // balance recibido desde WithdrawModal es el nuevo balance en stCELO
    const isStCelo = strategy === 'stcelo'
    const newStCeloBalance = Number(balance)
    const newSupplyBalance = isStCelo && withdrawRatio ? (newStCeloBalance * withdrawRatio).toString() : balance

    setAmount(isStCelo && withdrawRatio ? (Number(amount) * withdrawRatio).toString() : amount)
    setTxHash(hash)
    setNewBalance(isStCelo ? newSupplyBalance : balance)
    setMaxAmount(isStCelo ? newStCeloBalance : Number(balance))
    setLastOperationType('withdraw')
    setShowSuccess(true)
    setIsWithdrawModalOpen(false)
  }

  const handleWithdrawError = () => {
    setLastOperationType('withdraw')
    setShowError(true)
    setIsWithdrawModalOpen(false)
  }

  const handleDepositError = () => {
    setLastOperationType('deposit')
    setShowError(true)
    setIsDepositModalOpen(false)
  }

  const strategyIcon = strategy === 'stcelo' ? Celo : Coinmarket

  return (
    <Grid item xs={12} sm={6} md={6} lg={4}>
      <Card variant="outlined" sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box width={36} height={36} fontSize={36}>
              {typeof icon === 'function' ? (
                <SvgIcon component={icon} inheritViewBox alt="Compound" fontSize="inherit" width={36} height={30} />
              ) : (
                <Image src={icon} alt={title} width={36} height={30} />
              )}
            </Box>
            <Typography fontSize={18} fontWeight={600} fontFamily="Sora">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: depreciated ? '#FFF4E5' : '#EBECF1',
              px: 2,
              py: 0.5,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '16px',
            }}
          >
            {depreciated ? (
              <Typography fontSize={14} color="warning.main" fontWeight="medium">
                Deprecated
              </Typography>
            ) : (
              <>
                <Typography fontSize={14}>
                  APY: <strong>{apy.toFixed(1)}%</strong>
                </Typography>
                <SvgIcon
                  component={strategyIcon}
                  inheritViewBox
                  alt="Compound"
                  fontSize="inherit"
                  width={16}
                  height={16}
                />
              </>
            )}
          </Box>
        </Box>
        <Divider />

        <Box
          sx={{
            border: value > 0 ? (depreciated ? '1px dashed #ED6C02' : '1px dashed #1FC1BF') : '1px dashed #e0e0e0',
            borderRadius: 2,
            p: 3,
            m: 3,
            textAlign: 'center',
            bgcolor: value > 0 ? (depreciated ? '#FFF4E5' : '#E9F9F9') : 'transparent',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            My Deposit
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SvgIcon component={icon} inheritViewBox alt={balanceSymbol} width={16} height={16} />

            <Typography fontSize="18px" variant="h4" fontWeight="bold">
              {value === 0 ? '0.00' : value.toFixed(5)}
            </Typography>
          </Box>
        </Box>
        <Divider />

        <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
          {value > 0 ? (
            depreciated ? (
              <Button
                fullWidth
                sx={{ borderRadius: '6px', backgroundColor: '#F1F2F5' }}
                onClick={handleOpenWithdrawModal}
              >
                Withdraw
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  sx={{ borderRadius: '6px', backgroundColor: '#F1F2F5' }}
                  onClick={handleOpenWithdrawModal}
                >
                  Withdraw
                </Button>
                <Button variant="contained" fullWidth sx={{ borderRadius: '6px' }} onClick={handleOpenDepositModal}>
                  Deposit
                </Button>
              </>
            )
          ) : (
            !depreciated && (
              <Button
                variant="contained"
                color="complementary"
                fullWidth
                sx={{ borderRadius: '6px', border: 'none', boxShadow: 'none' }}
                onClick={handleOpenDepositModal}
              >
                Activate
              </Button>
            )
          )}
        </Box>
      </Card>

      <DepositModal
        open={isDepositModalOpen}
        onClose={handleCloseDepositModal}
        symbol={balanceSymbol}
        icon={icon}
        tokenAddress={tokenAddress as Address}
        vaultBalance={value.toString()}
        onSuccess={handleDepositSuccess}
        minDepositAmount={minDepositAmount}
        onError={handleDepositError}
        strategy={strategy}
        decimals={decimals}
        assetPrice={vault?.asset_price}
      />

      <WithdrawModal
        open={isWithdrawModalOpen}
        onClose={handleCloseWithdrawModal}
        symbol={balanceSymbol}
        icon={icon}
        maxAmount={withdrawMaxAmount ?? value}
        maxRawAmount={rawValue}
        decimals={decimals}
        tokenAddress={tokenAddress as Address}
        onSuccess={handleWithdrawSuccess}
        onError={handleWithdrawError}
        strategy={strategy}
        previewRatio={withdrawRatio}
        assetPrice={vault?.asset_price}
      />

      <SuccessModal
        open={showSuccess}
        onClose={handleCloseSuccess}
        amount={Number(amount).toFixed(2)} // Redondear a 2 decimales
        symbol={balanceSymbol}
        txHash={txHash}
        vaultBalance={newBalance}
        icon={icon}
        type={lastOperationType}
      />

      <ErrorModal
        open={showError}
        onClose={handleCloseShowError}
        type={lastOperationType}
        onTryAgain={handleTryAgain}
      />
    </Grid>
  )
}

function Vaults() {
  const address = useSafeAddress()
  const { balances } = useBalances()
  const { data: vaults, isLoading: isLoadingVaults } = useQuery<Vault[]>({
    queryKey: ['vaults', address],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_BASE_URI}/vaults/${address}`)
      return response.data
    },
    enabled: !!address,
  })

  if (isLoadingVaults || !vaults) {
    return (
      <Stack gap={2} p={{ xs: 0.5, md: 1 }} sx={{ width: '100%' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent sx={{ minHeight: { xs: 114, sm: 'auto' } }}>
                <Stack gap={1}>
                  <Skeleton variant="text" width={150} height={24} />
                  <Skeleton variant="text" width={120} height={32} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 0 }}>
              <CardContent sx={{ minHeight: { xs: 114, sm: 'auto' } }}>
                <Stack gap={1}>
                  <Skeleton variant="text" width={150} height={24} />
                  <Skeleton variant="text" width={120} height={32} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          {[1, 2, 3].map((index) => (
            <Grid item xs={4} key={index}>
              <Card variant="outlined" sx={{ p: 0 }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={100} height={24} />
                    </Box>
                    <Skeleton variant="rounded" width={120} height={32} />
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ p: 3, m: 3 }}>
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="text" width={80} height={32} />
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="rounded" width="100%" height={40} />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    )
  }

  const totalDeposits = vaults.reduce((sum: number, vault: Vault) => {
    return sum + (Number(vault.balance) || 0) * (vault.asset_price || 1)
  }, 0)

  const totalWeightedApy = vaults.reduce((sum: number, vault: Vault) => {
    const apr = Number(vault.apr) / 100
    return sum + (Number(vault.balance) || 0) * (vault.asset_price || 1) * apr
  }, 0)
  const averageApy = totalDeposits > 0 ? (totalWeightedApy / totalDeposits) * 100 : 0

  const getVaultIcon = (symbol: string): typeof cEUR | typeof wETH => {
    switch (symbol) {
      case 'cEUR':
        return cEUR
      case 'cUSD':
        return cUSD
      case 'WETH':
        return wETH
      case 'USDT':
        return USDT
      case 'CELO':
        return CELO
      default:
        return wETH
    }
  }

  return (
    <Stack gap={2} p={1} sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Vaults
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardContent sx={{ minHeight: { xs: 114, sm: 'auto' } }}>
              <Stack gap={1}>
                <Typography fontSize="16px" color="GrayText">
                  Total Vault Deposits
                </Typography>
                <Typography fontSize="24px" fontWeight={700}>
                  ${totalDeposits.toFixed(2)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardContent sx={{ minHeight: { xs: 114, sm: 'auto' } }}>
              <Stack gap={1}>
                <Typography fontSize="16px" color="GrayText">
                  Average APY
                </Typography>
                <Typography fontSize="24px" fontWeight={700}>
                  {averageApy.toFixed(2)}%
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {vaults.map((vault) => {
          const icon = getVaultIcon(vault.symbol)
          if (!icon) return null

          const apr =
            vault.apr !== undefined
              ? Number(vault.apr)
              : (Number(vault.rewards_apr) || 0) + (Number(vault.interest_apr) || 0)
          const strategy = (vault._strategy || 'aave').toString()

          const displayValue = strategy === 'stcelo' ? Number(vault.supply_balance) || 0 : Number(vault.balance) || 0

          // Ratio stCELO -> CELO para el withdraw preview
          const withdrawRatio =
            strategy === 'stcelo' && Number(vault.balance) > 0
              ? (Number(vault.supply_balance) || 0) / Number(vault.balance)
              : undefined

          // MaxAmount para withdraw: usar balance (stCELO) cuando es stcelo
          const withdrawMaxAmount = strategy === 'stcelo' ? Number(vault.balance) || 0 : displayValue

          return (
            <VaultCard
              key={(vault.reserve || vault.asset) as string}
              title={vault.name || vault.symbol}
              value={displayValue}
              rawValue={vault.raw_balance || '0'}
              apy={apr}
              icon={icon}
              tokenAddress={vault.asset}
              balanceSymbol={vault.symbol}
              strategy={strategy}
              depreciated={vault.depreciated}
              minDepositAmount={vault.min_deposit !== undefined ? String(vault.min_deposit) : undefined}
              decimals={vault.decimals}
              withdrawMaxAmount={withdrawMaxAmount}
              withdrawRatio={withdrawRatio}
              vault={vault}
            />
          )
        })}
      </Grid>
    </Stack>
  )
}

export default Vaults
