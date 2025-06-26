import { Box, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import SuperChainStart from '@/public/images/common/superchain-star.svg'
import css from './styles.module.css'
import { getBlockExplorerLink } from '@/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

const MESSAGES = ['Analyzing your activity…', 'Getting your badges ready…', 'Hang tight, finalizing everything…']

function LoadingModal({ open, title, hash }: { open: boolean; title: string; hash?: string }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter')

  const chain = useCurrentChain()
  const blockExplorerLink = chain && hash ? getBlockExplorerLink(chain, hash) : undefined

  useEffect(() => {
    if (!open) return

    let enterTimeout: NodeJS.Timeout
    let idleTimeout: NodeJS.Timeout
    let exitTimeout: NodeJS.Timeout

    setPhase('enter')

    enterTimeout = setTimeout(() => {
      setPhase('idle')
    }, 600) // duración entrada

    idleTimeout = setTimeout(() => {
      setPhase('exit')
    }, 3600) // entrada + espera

    exitTimeout = setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
      setPhase('enter')
    }, 4200) // entrada + espera + salida

    return () => {
      clearTimeout(enterTimeout)
      clearTimeout(idleTimeout)
      clearTimeout(exitTimeout)
    }
  }, [messageIndex, open])

  return (
    <Dialog className={css.container} open={open} onClose={() => {}}>
      <Box
        display="flex"
        flexDirection="column"
        gap="20px"
        padding="36px 24px"
        justifyContent="center"
        alignItems="center"
        fontSize="64px"
      >
        <Typography fontSize={24} fontWeight={600}>
          {title}
        </Typography>
        <SvgIcon className={css.spin} component={SuperChainStart} inheritViewBox fontSize="inherit" />
        {hash ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" fontSize={12} color="GrayText">
            <Typography color="GrayText">View on explorer</Typography>
            <ExplorerButton {...blockExplorerLink} icon={LinkIconBold} fontSize="inherit" color="inherit" />
          </Stack>
        ) : (
          <Box className={css.marqueeWrapper}>
            <Typography key={messageIndex} className={`${css.marqueeText} ${css[phase]}`}>
              {MESSAGES[messageIndex]}
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}

export default LoadingModal
