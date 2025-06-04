import React from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Link,
  Divider,
  DialogTitle,
  DialogActions,
  Stack,
} from '@mui/material'
import LaunchIcon from '@mui/icons-material/Launch'
import Image from 'next/image'
interface SuccessModalProps {
  open: boolean
  onClose: () => void
  amount: string
  symbol: string
  icon: any
  txHash?: string
  vaultBalance: string
  type: 'deposit' | 'withdraw'
}

function SuccessModal({ open, onClose, amount, symbol, txHash, vaultBalance, icon, type }: SuccessModalProps) {
  const isDeposit = type === 'deposit'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ p: '24px' }}>
        <Typography variant="h4" fontSize="24px" fontWeight="600" textAlign="center" fontFamily="Sora">
          {isDeposit ? 'Deposit' : 'Withdrawal'} Successful
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: '24px !important' }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap="16px">
          <Typography color="text.secondary" textAlign="center">
            You {isDeposit ? 'added' : 'withdrew'} <strong>{amount}</strong> {symbol} {isDeposit ? 'to' : 'from'} the{' '}
            {symbol} vault.
          </Typography>

          <Box
            sx={{
              backgroundColor: '#E9F9F9',
              borderRadius: 2,
              p: 3,
              width: '100%',
              border: '1px dashed #1FC1BF',
            }}
          >
            <Typography textAlign="center" fontSize="14px" gutterBottom>
              Updated Vault Balance
            </Typography>
            <Stack direction="row" justifyContent="center" fontSize="16px" gap="6px" alignItems="center">
              <Image src={icon} alt={symbol} width={28} height={24} />
              <Typography variant="h4" textAlign="center" fontWeight="medium">
                {Number(vaultBalance) === 0 ? '0.00' : Number(vaultBalance).toFixed(5)}
              </Typography>
            </Stack>
          </Box>

          {txHash && (
            <Link
              href={`https://optimistic.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography color="text.secondary" sx={{ textDecoration: 'underline' }}>
                Review tx details
              </Typography>
              <LaunchIcon fontSize="small" />
            </Link>
          )}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: '24px' }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onClose}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: '100px',
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
              backgroundColor: 'black',
            },
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SuccessModal
