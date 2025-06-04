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
  Link,
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
import useBalances from '@/hooks/useBalances'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import QrCodeButton from '../sidebar/QrCodeButton'
import Image from 'next/image'

interface DepositModalProps {
  open: boolean
  onClose: () => void
  symbol: string
  icon: any
  tokenAddress: Address
  supplyTokenAddress: Address
  vaultBalance: string
  onSuccess: (amount: string, hash: string, balance: string) => void
  onError: () => void
  minDepositAmount?: string
  tokenIcon: string
}

function DepositModal({
  open,
  onClose,
  symbol,
  icon,
  tokenAddress,
  supplyTokenAddress,
  vaultBalance,
  onSuccess,
  onError,
  minDepositAmount = '100',
  tokenIcon,
}: DepositModalProps) {
  const address = useSafeAddress()
  const { publicClient } = useSuperChainAccount()
  const { getCompoundDepositCallable } = useCompound()
  const queryClient = useQueryClient()
  const { balances, loading } = useBalances()
  const [amount, setAmount] = useState<string>('')
  const [isTouched, setIsTouched] = useState(false)

  const maxAmount = useMemo(() => {
    const token = balances.items.find((item) => item.tokenInfo.address === tokenAddress)
    if (!token) return 0
    const balance = token.balance
    const decimals = token.tokenInfo.decimals
    return balance ? Number(balance) / 10 ** decimals : 0
  }, [balances, tokenAddress])

  const { mutate: deposit, isPending: isDepositing } = useMutation({
    mutationFn: async () => {
      let hash = ''
      try {
        const depositCallable = getCompoundDepositCallable(tokenAddress, supplyTokenAddress)
        const tx = await depositCallable.callContract(amount)
        hash = tx.toString()
      } catch (error) {
        console.log(error)
        onError()
        setAmount('')
        return
      }
      try {
        await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 5000 })
      } catch (error) {
        console.log(error)
      }

      const calculatedNewBalance = (Number(vaultBalance) + Number(amount)).toString()
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
      setIsTouched(true)
    }
  }

  const handleDeposit = () => {
    if (isDepositing) return
    deposit()
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  const isValidAmount = Boolean(amount) && Number(amount) > 0 && maxAmount >= Number(amount)
  const meetsMinDeposit = Number(vaultBalance) > 0 || Number(amount) >= Number(minDepositAmount)
  const canDeposit = isValidAmount && meetsMinDeposit

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
              Deposit
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
                    <Image src={tokenIcon} alt={symbol} width={24} height={24} />
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
                  Available: {maxAmount}{' '}
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
              disabled={!canDeposit}
              sx={{ p: '16px', borderRadius: '100px', color: 'white !important', display: 'flex', gap: 1 }}
              onClick={handleDeposit}
            >
              {isDepositing ? (
                <>
                  <CircularProgress color="inherit" size={24} />
                  <Typography fontSize="16px" fontWeight="bold">
                    Depositing...
                  </Typography>
                </>
              ) : (
                'Deposit'
              )}
            </Button>

            <Box display="flex" flexDirection="column" gap="4px">
              {isTouched && !isValidAmount && meetsMinDeposit && (
                <Typography color="error" fontSize="14px" textAlign="center">
                  Please enter a valid amount.
                </Typography>
              )}
              {!meetsMinDeposit && (
                <Typography color="error" fontSize="14px" textAlign="center">
                  Min. deposit: {minDepositAmount} to activate this vault.
                </Typography>
              )}

              <Box display="flex" justifyContent="center" alignItems="center" gap="4px">
                <Typography fontSize="14px" color="text.secondary">
                  Low on {symbol}?
                </Typography>
                <QrCodeButton defaultToken={symbol}>
                  <Link href="#" underline="always" sx={{ cursor: 'pointer' }}>
                    Top up balance
                  </Link>
                </QrCodeButton>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DepositModal
