import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogActions, Typography, Button, Box, Divider } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface ErrorModalProps {
  open: boolean
  onClose: () => void
  onTryAgain: (type: 'deposit' | 'withdraw') => void
  type: 'deposit' | 'withdraw'
}

export default function ErrorModal({ open, onClose, onTryAgain, type }: ErrorModalProps) {
  const isDeposit = type === 'deposit'
  const tryAgain = () => {
    onTryAgain(type)
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          width: '360px',
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          pt: 3,
          pb: 2,
        }}
      >
        <Typography fontSize={24} fontWeight={600} fontFamily="Sora">
          {isDeposit ? 'Deposit' : 'Withdrawal'} Failed
        </Typography>
        <Box
          onClick={onClose}
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#F2F4F7',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 12 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={1} sx={{ mt: '24px' }}>
          <ErrorOutlineIcon sx={{ fontSize: 24, color: '#FF2B3E' }} />
          <Typography variant="body2" sx={{ color: '#FF2B3E', fontSize: '14px', fontWeight: 400 }}>
            Something went wrong during the transaction.
            <br />
            Please check your wallet or try again.
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          justifyContent: 'center',
          px: 3,
          py: 3,
          gap: '8px',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            width: '152px',
            height: '40px',
            borderRadius: '100px',
            backgroundColor: '#F2F2F2',
            color: '#000',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#E0E0E0',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={tryAgain}
          variant="contained"
          sx={{
            width: '152px',
            height: '40px',
            borderRadius: '100px',
            backgroundColor: '#FF2B3E',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#e6001f',
            },
          }}
        >
          Try Again
        </Button>
      </DialogActions>
    </Dialog>
  )
}
