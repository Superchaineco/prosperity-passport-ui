import React, { useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
  SvgIcon,
  Card,
  CardActionArea,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useVaults from '@/hooks/vaults/useVaults'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Address } from 'viem'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import useSafeAddress from '@/hooks/useSafeAddress'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import Image from 'next/image'

interface WithdrawModalProps {
  open: boolean
  onClose: () => void
  symbol: string
  icon: any
  maxAmount?: number
  maxRawAmount?: string
  tokenAddress: Address
  decimals: number
  onSuccess: (amount: string, hash: string, balance: string) => void
  onError: () => void
  strategy: string
  tokenIcon?: string
  // Nuevo: callback cuando se inicia el unstake con cooldown
  onUnstakingStarted?: (amount: string, availableAt: string) => void
}

type UnstakeMethod = 'instant' | 'cooldown'

function WithdrawModal({
  open,
  onClose,
  symbol,
  icon,
  maxAmount = 0,
  maxRawAmount = '0',
  tokenAddress,
  decimals,
  onSuccess,
  onError,
  strategy,
  tokenIcon,
  onUnstakingStarted,
}: WithdrawModalProps) {
  const address = useSafeAddress()
  const queryClient = useQueryClient()
  const { publicClient } = useSuperChainAccount()
  const { getWithdrawCallable } = useVaults()
  const [amount, setAmount] = useState<string>('')

  // Estado exclusivo para flujo de staking (mock -> on-chain)
  const isStakingFlow = strategy?.toLowerCase() === 'stcelo'
  const [step, setStep] = useState<'select' | 'form' | 'loading' | 'success'>('select')
  const [method, setMethod] = useState<UnstakeMethod>('cooldown')
  const [isStakingSubmitting, setIsStakingSubmitting] = useState(false)
  const [submittedAmount, setSubmittedAmount] = useState<string>('')
  const [pendingHash, setPendingHash] = useState<string>('')
  const [calculatedNewBalance, setCalculatedNewBalance] = useState<string>('')

  const availableFormatted = useMemo(() => (maxAmount || 0).toFixed(0), [maxAmount])

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      let hash = ''

      try {
        const withdrawCallable = getWithdrawCallable(strategy, tokenAddress, decimals)
        const withdrawAmount = Number(amount)
        const epsilon = 1e-2
        const isMaxAmount = Math.abs(withdrawAmount - maxAmount) <= epsilon

        const tx = await withdrawCallable.callContract(isMaxAmount ? maxRawAmount : amount, !isMaxAmount)
        hash = tx.toString()
      } catch (error) {
        console.log(error)
        setAmount('')
        onError()
        return
      }
      try {
        await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 5000 })
      } catch (error) {
        console.log(error)
      }

      const calculatedNewBalance = (Number(maxAmount) - Number(amount)).toString()
      await axios.post(`${BACKEND_BASE_URI}/vaults/${address}/refresh`)
      onSuccess(amount, hash, calculatedNewBalance)
      setAmount('')
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['vaults', address] })
    },
  })

  const handleSetMax = () => {
    setAmount(maxAmount.toString())
  }

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value === '' || !isNaN(Number(value))) {
      setAmount(value)
    }
  }

  const handleWithdraw = async () => {
    if (isStakingFlow) {
      if (!isValidAmount || isStakingSubmitting) return
      setIsStakingSubmitting(true)
      setSubmittedAmount(amount)
      setStep('loading')
      try {
        const withdrawCallable = getWithdrawCallable(strategy, tokenAddress, decimals)
        const withdrawAmount = Number(amount)
        const epsilon = 1e-2
        const isMaxAmount = Math.abs(withdrawAmount - maxAmount) <= epsilon

        const tx = await withdrawCallable.callContract(isMaxAmount ? maxRawAmount : amount, !isMaxAmount)
        const hash = tx.toString()

        try {
          await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 5000 })
        } catch (err) {
          console.log(err)
        }

        // refrescar backend
        try {
          await axios.post(`${BACKEND_BASE_URI}/vaults/${address}/refresh`)
        } catch (err) {
          console.log(err)
        }

        if (method === 'cooldown') {
          // No mostramos pantalla de éxito; informamos al padre y cerramos
          const availableAt = new Date()
          availableAt.setDate(availableAt.getDate() + 3)
          onUnstakingStarted?.(amount, availableAt.toISOString())
          setIsStakingSubmitting(false)
          handleClose()
          return
        }

        // Instant: mostramos éxito dentro del modal
        const newBal = (Number(maxAmount) - Number(amount || '0')).toString()
        setCalculatedNewBalance(newBal)
        setPendingHash(hash)
        setStep('success')
      } catch (error) {
        console.log(error)
        setAmount('')
        onError()
        setStep('form')
      } finally {
        setIsStakingSubmitting(false)
      }
      return
    }

    if (isWithdrawing) return
    withdraw()
  }

  const handleClose = () => {
    setAmount('')
    setStep('select')
    setMethod('cooldown')
    onClose()
  }

  const isValidAmount = Boolean(amount) && Number(amount) > 0

  // Fecha mock para "3-day unstake period"
  const availableDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }, [])

  const onContinueAfterSuccess = () => {
    // Finaliza el flujo tras éxito on-chain (o mock previo)
    const usedAmount = submittedAmount || amount || '0'
    const newBalance = calculatedNewBalance || (Number(maxAmount) - Number(usedAmount)).toString()
    const hash = pendingHash || '0x' + '0'.repeat(64)
    onSuccess(usedAmount, hash, newBalance)
    queryClient.refetchQueries({ queryKey: ['vaults', address] })
    handleClose()
  }

  const renderStakingSelect = () => (
    <Box padding="24px" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Choose How You Want to Unstake</Typography>

      <Card variant="outlined" aria-disabled sx={{ bgcolor: '#FFF6F0', opacity: 0.6, cursor: 'disabled' }}>
        <CardActionArea
          onClick={() => {
            // setMethod('instant')
            // setStep('form')
          }}
          sx={{ p: 2, alignItems: 'flex-start' }}
        >
          <Stack gap={0.5}>
            <Typography fontWeight={700}>Unstake Instantly</Typography>
            <Typography color="text.secondary">
              Get CELO instantly by swapping for a small fee through Regenerative.
            </Typography>
            <Typography sx={{ textDecoration: 'underline', mt: 1 }}>Withdraw Instantly</Typography>
          </Stack>
        </CardActionArea>
      </Card>

      <Card variant="outlined">
        <CardActionArea
          onClick={() => {
            setMethod('cooldown')
            setStep('form')
          }}
          sx={{ p: 2, alignItems: 'flex-start' }}
        >
          <Stack gap={0.5}>
            <Typography fontWeight={700}>Wait 3 Days</Typography>
            <Typography color="text.secondary">Unstake with a 3-day cooldown and receive full CELO amount.</Typography>
            <Typography sx={{ textDecoration: 'underline', mt: 1 }}>Start 3-day unstake period</Typography>
          </Stack>
        </CardActionArea>
      </Card>
    </Box>
  )

  const renderStakingForm = () => (
    <Box padding="24px" display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">Unstake</Typography>
      <Box
        display="flex"
        flexDirection="column"
        gap="8px"
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: '12px' }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TextField
            value={amount}
            onChange={handleAmountChange}
            variant="standard"
            type="number"
            inputMode="numeric"
            placeholder="0.00"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '24px',
                fontWeight: 500,
                '& input': {
                  p: 0,
                  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                  '-moz-appearance': 'textfield',
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box width={24} height={24} fontSize="24px">
              <Image src={tokenIcon || '/images/currencies/stCELO.svg'} alt="stCELO" width={28} height={24} />
            </Box>
            <Typography fontSize="16px" fontWeight="bold">
              stCELO
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography color="text.secondary" fontSize="14px">
            ${(Number(amount) || 0).toFixed(2)}
          </Typography>
          <Typography color="text.secondary" fontSize="14px">
            Available: {availableFormatted}{' '}
            <Button
              onClick={handleSetMax}
              size="small"
              sx={{
                minWidth: 'auto',
                p: 0,
                ml: 0.5,
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              MAX
            </Button>
          </Typography>
        </Stack>
      </Box>

      <Typography variant="subtitle1">Receive</Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: '12px' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Image src={'/images/currencies/celo.svg'} alt="CELO" width={24} height={24} />
            <Typography fontWeight={700}>CELO</Typography>
          </Stack>
          <Stack alignItems="flex-end">
            <Typography fontWeight={700}>{Number(amount || '0').toFixed(2)}</Typography>
            <Typography color="text.secondary">${(Number(amount) || 0).toFixed(2)}</Typography>
          </Stack>
        </Stack>
      </Box>

      {method === 'cooldown' ? (
        <Typography color="success.main">3-day unstake period</Typography>
      ) : (
        <Typography color="text.secondary">Swap via Regenerative (mocked)</Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        disabled={!isValidAmount || isStakingSubmitting}
        sx={{ p: '16px', borderRadius: '6px' }}
        onClick={handleWithdraw}
      >
        {isStakingSubmitting ? (
          <>
            <CircularProgress color="inherit" size={24} />
            <Typography fontWeight={700} ml={1}>
              Unstaking...
            </Typography>
          </>
        ) : (
          'Unstake'
        )}
      </Button>
    </Box>
  )

  const renderStakingLoading = () => (
    <Box padding="24px" display="flex" flexDirection="column" gap={2} alignItems="center">
      <CircularProgress />
      <Typography fontWeight={700}>Unstaking...</Typography>
    </Box>
  )

  const renderStakingSuccess = () => (
    <Box padding="24px" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Unstaking Initiated</Typography>
      <Typography>
        You've started a withdrawal of <strong>{Number(amount || '0').toFixed(2)} CELO</strong>. Your funds will be
        available in 3 days, by <strong>{availableDate}</strong>.
      </Typography>
      <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px', p: 2, bgcolor: '#F3FFF3' }}>
        <Typography>Funds available in 3 days</Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <Image src={'/images/currencies/celo.svg'} alt="CELO" width={20} height={20} />
          <Typography fontWeight={700}>{Number(amount || '0').toFixed(2)} CELO</Typography>
        </Stack>
      </Box>
      <Button variant="contained" fullWidth onClick={onContinueAfterSuccess}>
        Continue
      </Button>
    </Box>
  )

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box width={24} height={24} fontSize="24px">
              {typeof icon === 'function' ? (
                <SvgIcon component={icon} inheritViewBox alt="Compound" fontSize="inherit" width={28} height={24} />
              ) : (
                <Image src={icon} alt={symbol} width={28} height={24} />
              )}
            </Box>
            <Typography fontSize="24px" fontWeight="bold">
              {symbol} Vault
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {isStakingFlow ? (
            step === 'select' ? (
              renderStakingSelect()
            ) : step === 'form' ? (
              renderStakingForm()
            ) : step === 'loading' ? (
              renderStakingLoading()
            ) : (
              renderStakingSuccess()
            )
          ) : (
            <>
              <Box padding="24px" display="flex" flexDirection="column" gap="8px">
                <Typography variant="subtitle1" gutterBottom>
                  Withdraw
                </Typography>
                <Box
                  display="flex"
                  flexDirection="column"
                  gap="8px"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: '12px',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <TextField
                      value={amount}
                      onChange={handleAmountChange}
                      variant="standard"
                      type="number"
                      inputMode="numeric"
                      placeholder="0.00"
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontSize: '24px',
                          fontWeight: 500,
                          '& input': {
                            p: 0,
                            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                            '-moz-appearance': 'textfield',
                          },
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Box width={24} height={24} fontSize="24px">
                        {tokenIcon ? (
                          <Image src={tokenIcon} alt={symbol} width={28} height={24} />
                        ) : typeof icon === 'function' ? (
                          <SvgIcon
                            component={icon}
                            inheritViewBox
                            alt="Compound"
                            fontSize="inherit"
                            width={28}
                            height={24}
                          />
                        ) : (
                          <Image src={icon} alt={symbol} width={28} height={24} />
                        )}
                      </Box>
                      <Typography fontSize="16px" fontWeight="bold">
                        {symbol}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography color="text.secondary" fontSize="14px">
                      ${(Number(amount) || 0).toFixed(2)}
                    </Typography>
                    <Typography color="text.secondary" fontSize="14px">
                      Available: {maxAmount.toFixed(5)}{' '}
                      <Button
                        onClick={handleSetMax}
                        size="small"
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          ml: 0.5,
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          fontSize: '12px',
                          textDecoration: 'underline',
                        }}
                      >
                        MAX
                      </Button>
                    </Typography>
                  </Stack>
                </Box>
              </Box>
              <Divider />
              <Box padding="24px" display="flex" flexDirection="column" gap="8px">
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!isValidAmount}
                  sx={{ p: '16px', borderRadius: '6px', color: 'white !important', display: 'flex', gap: 1 }}
                  onClick={handleWithdraw}
                >
                  {isWithdrawing ? (
                    <>
                      <CircularProgress color="inherit" size={24} />
                      <Typography fontSize="16px" fontWeight="bold">
                        Withdrawing...
                      </Typography>
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WithdrawModal
