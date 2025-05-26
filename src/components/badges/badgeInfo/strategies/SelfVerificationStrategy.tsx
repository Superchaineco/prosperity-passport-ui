import React, { useState } from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { Button, Dialog, DialogContent } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import axios, { AxiosResponse } from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode'

class SelfVerificationStrategy implements BadgeRenderStrategy {
  private selfApp: any = null
  private userId: string | null = null

  constructor() {
    if (typeof document !== 'undefined') {
      this.initializeSelfApp()
    }
  }

  private async initializeSelfApp() {
    this.userId = uuidv4()
    this.selfApp = new SelfAppBuilder({
      appName: 'Prosperity Pass',
      scope: 'prosperity',
      endpoint: 'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
      logoBase64: 'https://pass.celopg.eco/images/pp-logo.png',
      userId: this.userId,
      disclosures: {
        gender: true,
        name: true,
        nationality: true,
      },
    }).build()
  }

  canRender(badge: ResponseBadge): boolean {
    return badge.metadata.name === 'Self verification'
  }

  render(badge: ResponseBadge): React.ReactNode {
    const SelfVerificationComponent = () => {
      const [isModalOpen, setIsModalOpen] = useState(false)

      const handleOpenModal = () => {
        setIsModalOpen(true)
      }

      const handleCloseModal = () => {
        setIsModalOpen(false)
      }

      const handleVerificationSuccess = () => {
        console.log('Verification successful')
        alert('Verification successful')
        handleCloseModal()
      }

      React.useEffect(() => {
        if (!isModalOpen) return

        const intervalId = setInterval(async () => {
          try {
            const response: AxiosResponse = await axios.get(`${BACKEND_BASE_URI}/self/check?userId=${userId}`)
            if (response.status === 200) {
              handleVerificationSuccess()
            }
          } catch {
            // Ignorar errores
          }
        }, 1000)

        return () => {
          clearInterval(intervalId)
        }
      }, [isModalOpen])

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
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={() => {
                  // Handle successful verification
                  console.log('Verification successful!')
                  // Redirect or update UI
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )
    }

    return <SelfVerificationComponent />
  }
}

export { SelfVerificationStrategy }
