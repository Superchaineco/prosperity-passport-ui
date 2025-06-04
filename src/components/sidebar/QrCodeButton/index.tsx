import { type ReactElement, type ReactNode, useState } from 'react'
import TopUpModal from '@/components/superChain/TopUpModal'

//const TopUpModal = dynamic(() => import('@/components/superChain/TopUpModal'))

const QrCodeButton = ({ children, defaultToken }: { children: ReactNode; defaultToken?: string }): ReactElement => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  return (
    <>
      <div data-testid="qr-modal-btn" onClick={() => setModalOpen(true)}>
        {children}
      </div>

      <TopUpModal open={modalOpen} onClose={() => setModalOpen(false)} defaultToken={defaultToken} />
    </>
  )
}

export default QrCodeButton
