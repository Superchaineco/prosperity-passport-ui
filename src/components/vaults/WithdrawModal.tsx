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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useCompound from '@/hooks/compound/useCompound'
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
  tokenAddress: Address
  supplyTokenAddress: Address
  onSuccess: (amount: string, hash: string, balance: string) => void
  onError: () => void
}

function WithdrawModal({
  open,
  onClose,
  symbol,
  icon,
  maxAmount = 0,
  tokenAddress,
  supplyTokenAddress,
  onSuccess,
  onError,
}: WithdrawModalProps) {
  const address = useSafeAddress()
  const queryClient = useQueryClient()
  const { publicClient } = useSuperChainAccount()
  const { getCompoundWithdrawCallable } = useCompound()
  const [amount, setAmount] = useState<string>('')

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      let hash = ''

      try {
        const withdrawCallable = getCompoundWithdrawCallable(tokenAddress, supplyTokenAddress)
        const tx = await withdrawCallable.callContract(amount)
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

    const withdrawAmount = Number(amount)
    const epsilon = 1e-2

    if (Math.abs(withdrawAmount - maxAmount) <= epsilon) {
      setAmount(maxAmount.toString())
    }

    withdraw()
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  const isValidAmount = Boolean(amount) && Number(amount) >= 0

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box width={24} height={24} fontSize="24px">
              <Image src={icon} alt={symbol} width={28} height={24} />
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
                    <Image src={icon} alt={symbol} width={28} height={24} />
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
              sx={{ p: '16px', borderRadius: '100px', color: 'white !important', display: 'flex', gap: 1 }}
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
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WithdrawModal
