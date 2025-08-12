import React, { useState } from 'react'
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
  Tooltip,
  InputAdornment,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
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
}

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
}: WithdrawModalProps) {
  const address = useSafeAddress()
  const queryClient = useQueryClient()
  const { publicClient } = useSuperChainAccount()
  const { getWithdrawCallable } = useVaults()
  const [amount, setAmount] = useState<string>('')
  const [selectedPct, setSelectedPct] = useState<number | null>(null)
  const [customPctInput, setCustomPctInput] = useState<string>('')

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

  const handleWithdraw = () => {
    if (isWithdrawing) return
    withdraw()
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  const isValidAmount = Boolean(amount) && Number(amount) > 0
  const isStakingVault = strategy === 'stcelo'

  const handleCustomPctChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    // Permitir vacío para que se vea el placeholder
    if (value === '') {
      setCustomPctInput('')
      setSelectedPct(null)
      setAmount('0')
      return
    }

    // Solo dígitos hasta 3 caracteres (0-100)
    if (!/^\d{0,3}$/.test(value)) {
      return
    }

    setCustomPctInput(value)

    const pct = Number(value)
    if (isNaN(pct)) return

    // Marcar inválido fuera de rango y no actualizar amount
    if (pct < 0 || pct > 100) {
      setSelectedPct(null)
      setAmount('0')
      return
    }

    setSelectedPct(pct)
    const newAmount = ((maxAmount * pct) / 100).toFixed(2)
    setAmount(newAmount)
  }

  const renderWithdrawUI = () => {
    if (isStakingVault) {
      // Invalidación visual del input de porcentaje
      const pctNum = Number(customPctInput)
      const isPctInvalid = customPctInput !== '' && (isNaN(pctNum) || pctNum < 0 || pctNum > 100)

      return (
        <Box padding="24px" display="flex" flexDirection="column" gap="8px">
          <Typography variant="subtitle1" gutterBottom>
            Select your withdrawal amount
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-start">
            {[10, 25, 50, 100].map((percentage) => (
              <Button
                key={percentage}
                variant="contained"
                size="small"
                onClick={() => {
                  const amt = ((maxAmount * percentage) / 100).toFixed(2)
                  setAmount(amt)
                  setSelectedPct(percentage)
                  setCustomPctInput(String(percentage))
                }}
                disabled={maxAmount <= 0}
                sx={{
                  background: selectedPct === percentage ? '#6B6B6B' : '#EBECF1',
                  color: selectedPct === percentage ? '#FFFFFF' : '#000000',
                  '&:hover': {
                    color: selectedPct === percentage ? '#FFFFFF' : '#FFFFFF',
                  },
                }}
              >
                {percentage}%
              </Button>
            ))}
            <TextField
              key="custom-pct"
              type="number"
              size="small"
              value={customPctInput}
              onChange={handleCustomPctChange}
              disabled={maxAmount <= 0}
              placeholder="0"
              inputProps={{ min: 0, max: 100, step: 1 }}
              error={isPctInvalid}
              sx={{ width: 84 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Stack>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Typography variant="subtitle1">Withdraw Preview</Typography>
            <Stack direction="row" gap={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                incl. fees
              </Typography>
              <Tooltip title="The swap fee is paid to allow instant withdrawal of CELO from stCELO instead of waiting the regular 3 days required to withdraw.">
                <InfoOutlinedIcon fontSize="small" color="action" />
              </Tooltip>
            </Stack>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: '12px' }}
          >
            <Typography fontSize="24px" fontWeight="bold">
              {Number(amount || '0').toFixed(2)}
            </Typography>
            <Box display="flex" alignItems="center" gap="6px">
              {typeof icon === 'function' ? (
                <SvgIcon component={icon} inheritViewBox fontSize="inherit" width={28} height={24} />
              ) : (
                <Image src={icon} alt={symbol} width={28} height={24} />
              )}
              <Typography fontSize="16px" fontWeight="bold">
                {symbol}
              </Typography>
            </Box>
          </Box>
        </Box>
      )
    }

    return (
      <Box padding="24px" display="flex" flexDirection="column" gap="8px">
        <Typography variant="subtitle1" gutterBottom>
          Withdraw
        </Typography>
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
              <SvgIcon component={icon} inheritViewBox alt={symbol} fontSize="inherit" width={28} height={24} />
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
    )
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box width={24} height={24} fontSize="24px">
              {typeof icon === 'function' ? (
                <SvgIcon component={icon} inheritViewBox fontSize="inherit" width={28} height={24} />
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

        <DialogContent sx={{ p: 0 }}>{renderWithdrawUI()}</DialogContent>

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
      </Dialog>
    </>
  )
}

export default WithdrawModal
