// components/ClaimCompletedDialog.tsx
import * as React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Divider,
  SvgIcon,
  Link as MUILink,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Image, { StaticImageData } from 'next/image'
import type { Address } from 'viem'

export interface ClaimCompletedDialogProps {
  open: boolean
  onClose: () => void
  onContinue?: () => void
  symbol: string
  icon: React.ElementType | StaticImageData | string
  amount: string
  amountUsd: string
  txHash: Address
  title?: string
}

function formatUsd(value: string): string {
  return `$${value}`
}

export default function ClaimCompletedDialog(props: ClaimCompletedDialogProps) {
  const { open, onClose, onContinue, symbol, icon, amount, amountUsd, txHash, title = 'Claim Completed' } = props

  const handleContinue: () => void = () => {
    if (onContinue) onContinue()
    else onClose()
  }

  const txUrl: string = `https://celoscan.io/tx/${txHash}`

  const renderIcon = (
    <Box width={28} height={28} display="flex" alignItems="center" justifyContent="center">
      {typeof icon === 'function' ? (
        <SvgIcon component={icon} inheritViewBox fontSize="inherit" />
      ) : (
        <Image
          src={icon as StaticImageData | string}
          alt={`${symbol} icon`}
          width={24}
          height={24}
          style={{ borderRadius: 4 }}
        />
      )}
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { width: 360, maxWidth: '100%' },
      }}
    >
      <DialogTitle
        sx={{
          p: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          component="h2"
          sx={{
            color: 'var(--Foundation-Black, #000)',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            fontSize: '24px',
            fontStyle: 'normal',
            fontWeight: 600,
            lineHeight: '32px', // 133.333%
            letterSpacing: '-0.12px',
          }}
        >
          {title}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={2} sx={{ px: 2.5, pb: 2.5, pt: 2 }}>
          <Typography
            sx={{
              color: 'var(--Foundation-Grey-grey-800, #75757A)',
              textAlign: 'center',
              fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '20px', // 142.857%
            }}
          >
            You’ve successfully claimed your rewards.
            <br />
            Your {symbol} has been sent to your account.
          </Typography>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {renderIcon}
              <Typography
                sx={{
                  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                {symbol}
              </Typography>
            </Stack>

            <Stack spacing={0} alignItems="flex-end">
              <Typography
                sx={{
                  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                {amount}
              </Typography>
              <Typography
                sx={{
                  color: 'var(--Foundation-Grey-grey-800, #75757A)',
                  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '12px',
                  lineHeight: 1.2,
                  fontWeight: 400,
                }}
              >
                {formatUsd(amountUsd)}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <MUILink
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'var(--Foundation-Grey-grey-900, #4B4B4E)',
                fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                fontSize: '12px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: '16px', // 133.333%
                textDecorationLine: 'underline',
                textDecorationStyle: 'solid',
                textDecorationSkipInk: 'none',
                textDecorationThickness: 'auto',
                textUnderlineOffset: 'auto',
                textUnderlinePosition: 'from-font',
                width: 'fit-content',
              }}
            >
              Review tx details <OpenInNewIcon sx={{ fontSize: 16 }} />
            </MUILink>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <Box sx={{ p: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleContinue}
          sx={{
            py: 1.5,
            borderRadius: '6px',
            fontWeight: 700,
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          Continue
        </Button>
      </Box>
    </Dialog>
  )
}
