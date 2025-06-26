import type { ResponseBadge } from '@/types/super-chain'
import type { BadgeRenderStrategy } from '../BadgeStrategyRenderer'
import { AuthKitProvider, SignInButton, UseSignInData } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'
import React, { useEffect, useRef, useState } from 'react'
import useSafeAddress from '@/hooks/useSafeAddress'
import { Box } from '@mui/material'

import { JSON_RPC_PROVIDER } from '@/features/superChain/constants'
import { BACKEND_AUTH_URI, BACKEND_BASE_URI } from '@/config/constants'
import axios from 'axios'

class FarcasterLinkStrategy implements BadgeRenderStrategy {
  canRender(badge: ResponseBadge): boolean {
    return badge.metadata.name === 'FarCaster Connection'
  }

  render(badge: ResponseBadge): React.ReactNode {
    return <MemoizedFarcasterVerificationComponent badge={badge} />
  }
}

export { FarcasterLinkStrategy }

const domain = 'pass.celopg.eco'
const siweUri = BACKEND_AUTH_URI + '/verify'
const rpcUrl = JSON_RPC_PROVIDER

export function FarcasterVerificationComponent({ badge }: { badge: ResponseBadge }) {
  const address = useSafeAddress()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState('Link Account')
  useEffect(() => {
    const innerSpan = buttonRef.current?.querySelector('span')
    if (innerSpan) {
      innerSpan.textContent = currentUser
    }
  }, [currentUser])

  const onSucess = async (res: UseSignInData) => {
    setCurrentUser(res.displayName!)
    const httpInstance = axios.create({
      baseURL: BACKEND_BASE_URI,
      withCredentials: true,
    })

    try {
      await httpInstance.post(`${BACKEND_BASE_URI}/farcaster/verify/${address}`, { ...res })
      window.dispatchEvent(new CustomEvent('claim-badges'))
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }
  if (Number(badge.tier) == 0)
    return (
      <AuthKitProvider
        config={{
          domain,
          siweUri,
          rpcUrl,
        }}
      >
        <Box ref={buttonRef} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SignInButton hideSignOut={true} onSuccess={onSucess} />
        </Box>
      </AuthKitProvider>
    )
  return <></>
}

export const MemoizedFarcasterVerificationComponent = React.memo(FarcasterVerificationComponent)
