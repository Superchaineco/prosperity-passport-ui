import { Box, Button, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import css from './styles.module.css'
import { formatEther } from 'viem'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'
import { Token } from '../TopUp'

function SuccessTxn({
  hash,
  value,
  token,
  open,
  onClose,
}: {
  hash: string
  value: bigint
  token: Token
  open: boolean
  onClose: () => void
}) {
  const chain = useCurrentChain()
  const blockExplorerLink = chain ? getBlockExplorerLink(chain, hash) : undefined

  return (
    <Dialog className={css.container} open={open} onClose={onClose}>
      <Box
        display="flex"
        flexDirection="column"
        gap="20px"
        padding="36px 24px 36px 24px"
        justifyContent="center"
        alignItems="center"
        fontSize="64px"
      >
        <Typography fontSize={24} fontWeight={600}>
          Top-Up success!
        </Typography>
        <Box
          display="flex"
          flexDirection="row"
          gap="8px"
          justifyContent="center"
          alignItems="center"
          bgcolor="#ECF0F7"
          padding="8px"
          borderRadius="6px"
        >
          <Typography fontWeight={600} fontSize={22}>
            {formatEther(value)}
          </Typography>
          <SvgIcon inheritViewBox component={token.icon} />
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" fontSize={12} color="GrayText">
          <Typography color="GrayText" fontWeight={600} fontSize={12}>
            View tx on explorer
          </Typography>
          <ExplorerButton {...blockExplorerLink} icon={LinkIconBold} fontSize="inherit" color="inherit" />
        </Stack>
      </Box>
      <Button className={css.outsideButton} onClick={onClose} variant="contained">
        Continue
      </Button>
    </Dialog>
  )
}

export default SuccessTxn
