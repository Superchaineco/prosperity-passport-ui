import React, { useState, useEffect, useContext } from 'react'
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
  Alert,
  Checkbox,
  FormControlLabel,
  Skeleton,
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
import { TxModalContext } from '../tx-flow'
import { TokenTransferFlow } from '../tx-flow/flows'

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
  previewRatio?: number
  assetPrice?: number
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
  previewRatio,
  assetPrice = 0,
}: WithdrawModalProps) {
  const address = useSafeAddress()
  const queryClient = useQueryClient()
  const { publicClient } = useSuperChainAccount()
  const { getWithdrawCallable, getExpectedOutputAmount, slippage } = useVaults()
  const [amount, setAmount] = useState<string>('')
  const [selectedPct, setSelectedPct] = useState<number | null>(null)
  const [customPctInput, setCustomPctInput] = useState<string>('')
  const [dynamicPreviewAmount, setDynamicPreviewAmount] = useState<string>('0')
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false)
  const [showSlippageWarning, setShowSlippageWarning] = useState<boolean>(false)
  const [isCalculatingPreview, setIsCalculatingPreview] = useState<boolean>(false)
  const { setTxFlow } = useContext(TxModalContext)

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

      // Calcular nuevo balance local (en unidades del vault: stCELO cuando strategy === 'stcelo')
      const withdrawAmountNum = Number(amount) || 0
      const epsilon = 1e-2
      const isMaxAmount = Math.abs(withdrawAmountNum - maxAmount) <= epsilon
      const newBalanceNum = isMaxAmount ? 0 : Math.max(0, Number(maxAmount) - withdrawAmountNum)

      await axios.post(`${BACKEND_BASE_URI}/vaults/${address}/refresh`)
      onSuccess(amount, hash, newBalanceNum.toString())
      setAmount('')
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['vaults', address] })
    },
  })

  const handleSetMax = async () => {
    const maxAmountStr = maxAmount.toString()
    setAmount(maxAmountStr)
    if (isStakingVault) {
      await updatePreviewAmount(maxAmountStr)
    }
  }

  const onSendClick = (tokenAddress: string) => {
    handleClose()
    setTxFlow(<TokenTransferFlow tokenAddress={tokenAddress} />)
  }

  const handleAmountChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value === '' || !isNaN(Number(value))) {
      setAmount(value)
      // Calcular preview amount dinámicamente si es vault de staking
      if (isStakingVault) {
        await updatePreviewAmount(value)
      }
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

  const isValidAmount = Boolean(amount) && Number(amount) > 0 && Number(amount) <= maxAmount
  const isStakingVault = strategy === 'stcelo'

  // Función para calcular el preview amount dinámicamente
  const updatePreviewAmount = async (inputAmount: string) => {
    if (!isStakingVault || !inputAmount || Number(inputAmount) === 0) {
      setDynamicPreviewAmount('0')
      return
    }

    setIsCalculatingPreview(true) // Indicar que se está calculando el preview

    try {
      const expectedOutput = await getExpectedOutputAmount(inputAmount, decimals)
      console.debug('Expected output from dynamic calculation:', expectedOutput)
      setDynamicPreviewAmount(Number(expectedOutput).toFixed(2))
    } catch (error) {
      console.error('Error calculando preview amount:', error)
      // Fallback al ratio estático si falla la consulta
      const fallbackAmount = (Number(inputAmount) * (previewRatio || 1)).toFixed(2)
      setDynamicPreviewAmount(fallbackAmount)
    } finally {
      setIsCalculatingPreview(false) // Finalizar el cálculo del preview
    }
  }

  const handleCustomPctChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    // Permitir vacío para que se vea el placeholder
    if (value === '') {
      setCustomPctInput('')
      setSelectedPct(null)
      setAmount('0')
      setDynamicPreviewAmount('0')
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
      setDynamicPreviewAmount('0')
      return
    }

    setSelectedPct(pct)
    const newAmount = ((maxAmount * pct) / 100).toFixed(2)
    setAmount(newAmount)

    await updatePreviewAmount(newAmount)
  }

  const renderWithdrawUI = () => {
    if (isStakingVault) {
      // Usar el preview amount dinámico o fallback al cálculo estático
      const previewAmount = isCalculatingPreview
        ? null // No mostrar el valor mientras se calcula
        : dynamicPreviewAmount !== '0'
        ? dynamicPreviewAmount
        : (Number(amount || '0') * (previewRatio || 1)).toFixed(2)
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
                onClick={async () => {
                  const newAmount = ((maxAmount * percentage) / 100).toFixed(2)
                  setAmount(newAmount)
                  setSelectedPct(percentage)
                  setCustomPctInput(String(percentage))
                  await updatePreviewAmount(newAmount)
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
              sx={{ width: 98 }}
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
            {isCalculatingPreview ? (
              <Skeleton variant="text">
                <Typography fontSize="24px" fontWeight="bold">
                  +++++++++++++++
                </Typography>
              </Skeleton>
            ) : (
              <Typography fontSize="24px" fontWeight="bold">
                {previewAmount}
              </Typography>
            )}
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
              ${((Number(amount) || 0) * assetPrice).toFixed(2)}
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

  useEffect(() => {
    if (!slippage) return
    if (slippage > 3) {
      setShowSlippageWarning(true)
    } else {
      setShowSlippageWarning(false)
    }
  }, [slippage])

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
        <Box p="24px" display="flex" flexDirection="column" gap="16px">
          {showSlippageWarning && (
            <>
              <Box sx={{ border: '1px solid #FA8900', backgroundColor: '#FFF7E6', borderRadius: '8px' }}>
                <Alert severity="warning">
                  <Typography fontWeight="bold" color="#FA8900" gutterBottom>
                    High demand detected
                  </Typography>
                  <Typography>Current demand may cause significant slippage on your withdrawal. You can:</Typography>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li style={{ marginBottom: '4px' }}>Continue anyway</li>
                    <li style={{ marginBottom: '4px' }}>Withdraw less to reduce slippage</li>
                    <li>Wait for lower demand to receive more CELO</li>
                  </ul>
                  <Button
                    variant="text"
                    onClick={() => onSendClick('0xC668583dcbDc9ae6FA3CE46462758188adfdfC24')}
                    sx={{ color: '#FA8900', textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                  >
                    <Typography>
                      Or, withdraw your stCELO directly from your Prosperity Passport via transaction
                    </Typography>
                  </Button>
                </Alert>
              </Box>
              <Box display="flex" flexDirection="column" gap="8px">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAcknowledged}
                      onChange={(e) => setIsAcknowledged(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="I acknowledge the slippage and want to proceed"
                />
              </Box>
            </>
          )}

          <Button
            variant="contained"
            fullWidth
            disabled={!isValidAmount || isWithdrawing || !isAcknowledged}
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
