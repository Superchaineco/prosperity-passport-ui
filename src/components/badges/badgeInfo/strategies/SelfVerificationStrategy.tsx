import React, { useEffect, useState } from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { Button, Dialog, DialogContent } from '@mui/material'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useSafeAddress from '@/hooks/useSafeAddress'

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
              gender: true,
              name: true,
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
        console.log('Verification successful')
        alert('Verification successful')
        queryClient.invalidateQueries({ queryKey: ['self-verification', address] })
        handleCloseModal()
      }

      const { data } = useQuery({
        queryKey: ['self-verification', address],
        refetchInterval: 1000,
        queryFn: () => axios.get(`${BACKEND_BASE_URI}/self/check?userId=${address}`),
        enabled: isModalOpen && !!address,
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
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 24px',
              marginTop: '16px',
              marginBottom: '16px',
            }}
          >
            Verify Badge
          </Button>

          <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
            <DialogContent>
              <SelfQRcode selfApp={selfApp} onSuccess={handleVerificationSuccess} />
            </DialogContent>
          </Dialog>
        </>
      )
    }

    return <SelfVerificationComponent />
  }
}

export { SelfVerificationStrategy }
