import React, { useEffect, useState } from 'react'
import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { Button, Dialog, DialogContent } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'

export class SelfVerificationStrategy implements BadgeRenderStrategy {
  private SelfQRcode: any = null
  private selfApp: any = null
  private userId: string | null = null

  constructor() {
    if (typeof document !== 'undefined') {
      this.initializeSelfApp()
    }
  }

  private async initializeSelfApp() {
    this.userId = uuidv4()

    const { SelfAppBuilder } = await import('@selfxyz/qrcode')
    this.selfApp = new SelfAppBuilder({
      appName: 'Prosperity Account',
      scope: 'prosperity-account',
      endpoint: 'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
      devMode: true,
      logoBase64: 'https://account.celopg.eco/images/pp-logo.png',
      userId: this.userId,
    }).build()

    const mod = await import('@selfxyz/qrcode')
    this.SelfQRcode = mod.SelfQRcode
  }

  canRender(badge: ResponseBadge): boolean {
    return badge.metadata.name === 'Self verification'
  }

  render(badge: ResponseBadge): React.ReactNode {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleOpenModal = () => {
      setIsModalOpen(true)
    }

    const handleCloseModal = () => {
      setIsModalOpen(false)
    }

    const handleVerificationSuccess = () => {
      console.log('Verification successful')
      handleCloseModal()
    }

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
            {this.selfApp && this.SelfQRcode && (
              <this.SelfQRcode selfApp={this.selfApp} onSuccess={handleVerificationSuccess} />
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }
}
