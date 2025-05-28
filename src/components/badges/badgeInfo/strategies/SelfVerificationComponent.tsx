import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useSafeAddress from '@/hooks/useSafeAddress'
import CloseIcon from '@mui/icons-material/Close'
import CountryFlag from '@/components/countryFlag'
import { ResponseBadge } from '@/types/super-chain'

export function SelfVerificationComponent({ badge }: { badge: ResponseBadge }) {
  const [isValidationModalOpen, setValidationModalOpen] = useState(false)
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false)
  const [selfApp, setSelfApp] = useState<any>(null)
  const [SelfQRcode, setSelfQRcode] = useState<any>(null)
  const address = useSafeAddress()
  const queryClient = useQueryClient()

  useEffect(() => {
    const init = async () => {
      const { default: SelfQRcodeComponent, SelfAppBuilder } = await import('@selfxyz/qrcode')
      setSelfQRcode(() => SelfQRcodeComponent)

      const app = new SelfAppBuilder({
        appName: 'Prosperity Pass',
        scope: 'prosperity',
        endpoint: 'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
        logoBase64: 'https://pass.celopg.eco/images/pp-logo.png',
        userId: address,
        userIdType: 'hex',
        disclosures: {
          nationality: true,
        },
      }).build()

      setSelfApp(app)
    }

    if (address) {
      init()
    }
  }, [address])

  const handleOpenModal = () => {
    setValidationModalOpen(true)
  }

  const handleCloseModal = () => {
    setValidationModalOpen(false)
  }

  const handleVerificationSuccess = () => {
    if (isValidationModalOpen && data?.check) {
      queryClient.invalidateQueries({ queryKey: ['self-verification', address] })
      setValidationModalOpen(false)
      setSuccessModalOpen(true)
    }
  }

  const handleSuccessModalClose = () => {
    setSuccessModalOpen(false)
    window.dispatchEvent(new CustomEvent('claim-badges'))
  }

  const { data } = useQuery({
    queryKey: ['self-verification', address],
    refetchInterval: (query) => {
      if (query.state.data?.check) return false
      console.log('Refetch:', query.state.data)
      if (isValidationModalOpen || query.state == undefined) return 1000
      return false
    },
    queryFn: async () => (await axios.get(`${BACKEND_BASE_URI}/self/check?userId=${address}`)).data,
    enabled: !!address,
  })

  useEffect(() => {
    if (data?.check) handleVerificationSuccess()
  }, [data])

  if (!address || !selfApp || !SelfQRcode) return null

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenModal}
        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, padding: '8px 24px', mt: 2, mb: 2 }}
        disabled={data == undefined || data?.check}
      >
        {data?.check ? 'Verified' : 'Verify'}
      </Button>

      <Dialog
        open={isValidationModalOpen}
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 0, minWidth: 500 } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={3} pt="24px" pb="0px">
          <DialogTitle sx={{ fontWeight: 600, fontSize: '24px', fontFamily: 'Inter', p: 0 }}>
            Self Verification
          </DialogTitle>
          <IconButton onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mt: '24px', mb: '10px' }} />
        <DialogContent sx={{ textAlign: 'center', px: 3 }}>
          <Box display="flex" justifyContent="center" mb="24px">
            <SelfQRcode selfApp={selfApp} onSuccess={handleVerificationSuccess} />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Scan this QR code to verify your identity through{' '}
            <Typography
              component="a"
              href="https://self.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#476520', fontWeight: 500, textDecorationLine: 'underline' }}
            >
              self.xyz
            </Typography>
            .
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', mb: '24px' }}>
            We&apos;ll only confirm your Self verification status and validate your country.
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 0, minWidth: 500 } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={3} pt="24px">
          <DialogTitle sx={{ fontWeight: 600, fontSize: '24px', fontFamily: 'Inter', p: 0 }}>
            Self Verification Successful
          </DialogTitle>
        </Box>
        <Divider sx={{ mt: '24px' }} />
        <DialogContent sx={{ textAlign: 'center', px: 3, pt: '24px', pb: '24px' }}>
          {data?.data && (
            <Box display="flex" justifyContent="center" mb="24px">
              <CountryFlag alpha3={data.data?.nationality ?? ''} size={75} />
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: '24px' }}>
            Your country flag is now visible on your profile and the leaderboard.
          </Typography>
          <Button
            variant="contained"
            onClick={handleSuccessModalClose}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              ':hover': { backgroundColor: '#222' },
            }}
          >
            Claim Badge
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
export const MemoizedSelfVerificationComponent = React.memo(SelfVerificationComponent)
