import React, { useEffect, useState } from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useSafeAddress from '@/hooks/useSafeAddress'
import CloseIcon from '@mui/icons-material/Close'
import CountryFlag from '@/components/countryFlag'

class SelfVerificationStrategy implements BadgeRenderStrategy {
  canRender(badge: ResponseBadge): boolean {
    return badge.metadata.name === 'Self verification'
  }

  render(badge: ResponseBadge): React.ReactNode {
    const SelfVerificationComponent = () => {
      const [isModalOpen, setIsModalOpen] = useState(false)
      const [selfApp, setSelfApp] = useState<any>(null)
      const [SelfQRcode, setSelfQRcode] = useState<any>(null)
      const address = useSafeAddress()
      const queryClient = useQueryClient()
      const [successModalOpen, setSuccessModalOpen] = useState(false)

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
        setIsModalOpen(true)
      }

      const handleCloseModal = () => {
        setIsModalOpen(false)
      }

      const handleVerificationSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['self-verification', address] })
        setIsModalOpen(false)
        setSuccessModalOpen(true)
      }

      const handleSuccessModalClose = () => {
        setSuccessModalOpen(false)
        // Redirigir a dashboard si deseas:
        // router.push('/dashboard')
      }

      const { data } = useQuery({
        queryKey: ['self-verification', address],
        refetchInterval: 1000,
        queryFn: async () => (await axios.get(`${BACKEND_BASE_URI}/self/check?userId=${address}`)).data,
        enabled: !!address,
      })

      useEffect(() => {
        console.debug(data)
      }, [data])

      if (!address || !selfApp || !SelfQRcode) return null

      return (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenModal}
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 24px',
              marginTop: '16px',
              marginBottom: '16px',
            }}
            disabled={data?.check}
          >
            {data?.check ? 'Verified' : 'Verify'}
          </Button>

          <Dialog
            open={isModalOpen}
            onClose={handleCloseModal}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '12px',
                p: 0,
                minWidth: 500,
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" px={3} pt="24px" pb="0px">
              <DialogTitle
                sx={{
                  fontWeight: 600,
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  lineHeight: '32px',
                  letterSpacing: '0px',
                  p: 0,
                }}
              >
                Self Verification
              </DialogTitle>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mt: '24px', mb: '10px' }} />

            <DialogContent
              sx={{
                textAlign: 'center',
                px: 3,
              }}
            >
              <Box display="flex" justifyContent="center" mb="24px">
                <SelfQRcode selfApp={selfApp} onSuccess={handleVerificationSuccess} />
              </Box>

              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  lineHeight: '140%',
                  letterSpacing: '0.25px',
                }}
              >
                Scan this QR code to verify your identity through{' '}
                <Typography
                  sx={{
                    color: '#476520',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: '140%',
                    letterSpacing: '0.25px',
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'solid',
                    textUnderlineOffset: 'auto',
                  }}
                  component="a"
                  href="https://self.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  self.xyz
                </Typography>
                .
              </Typography>

              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '12px',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: '140%',
                  letterSpacing: '0.25px',
                  textAlign: 'center',
                  mb: '24px',
                }}
              >
                We&apos;ll only confirm your Self verification status and validate your country.
              </Typography>
            </DialogContent>
          </Dialog>

          <Dialog
            open={successModalOpen}
            onClose={handleSuccessModalClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '12px',
                p: 0,
                minWidth: 500,
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" px={3} pt="24px">
              <DialogTitle
                sx={{
                  fontWeight: 600,
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  lineHeight: '32px',
                  letterSpacing: '0px',
                  p: 0,
                }}
              >
                Self Verification Successful
              </DialogTitle>
              <IconButton onClick={handleSuccessModalClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mt: '24px' }} />

            <DialogContent
              sx={{
                textAlign: 'center',
                px: 3,
                pt: '24px',
                pb: '24px',
              }}
            >
              {data?.data && (
                <Box display="flex" justifyContent="center" mb="24px">
                  <CountryFlag alpha3={data.data?.nationality ?? ''} />
                </Box>
              )}

              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#000',
                  lineHeight: '140%',
                  letterSpacing: '0.25px',
                  mb: '24px',
                }}
              >
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
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '14px',
                  ':hover': {
                    backgroundColor: '#222',
                  },
                }}
              >
                Accept
              </Button>
            </DialogContent>
          </Dialog>
        </>
      )
    }

    return <SelfVerificationComponent />
  }
}

export { SelfVerificationStrategy }
