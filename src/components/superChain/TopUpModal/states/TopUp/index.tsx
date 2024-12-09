import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { Box, Button, Grid, MenuItem, Select, SvgIcon, TextField, useMediaQuery, useTheme } from '@mui/material'
import { makeStyles } from '@mui/styles'
import css from './styles.module.css'
import classNames from 'classnames'
import NounsAvatar from '@/components/common/NounsAvatar'
import CopyButton from '@/components/common/CopyButton'
import ExplorerButton from '@/components/common/ExplorerButton'
import Image from 'next/image'
import Celo from '@/public/images/currencies/celo.svg'
import lightPalette from '@/components/theme/lightPalette'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { Address, erc20Abi, parseUnits } from 'viem'
import ModalDialog from '@/components/common/ModalDialog'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { shortenAddress } from '@/utils/formatters'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import { SvgIconComponent } from '@mui/icons-material'
const useStyles = makeStyles({
  select: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: lightPalette.primary.main,
    '&:before': {
      borderColor: lightPalette.primary.main,
    },
    '&:after': {
      borderColor: lightPalette.primary.main,
    },
    '&:not(.Mui-disabled):hover::before': {
      borderColor: lightPalette.primary.main,
    },
  },
  icon: {
    fill: 'white',
  },
  root: {
    color: 'white',
  },
})

export type Token = {
  values: number[]
  decimals: number
  address: string
  icon: SvgIconComponent
}

const tokens: Record<string, Token> = {
  CELO: { values: [10, 20, 50], decimals: 18, address: '0x471EcE3750Da237f93B8E339c536989b8978a438', icon: Celo },
}

function TopUp({
  handleTopUp,
  open,
  onClose,
}: {
  handleTopUp: (value: bigint, token: Token) => void
  open: boolean
  onClose: () => void
}): ReactElement {
  const { publicClient } = useSuperChainAccount()
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)
  const wallet = useWallet()

  const chain = useCurrentChain()
  const blockExplorerLink =
    chain && superChainSmartAccount.data.smartAccount
      ? getBlockExplorerLink(chain, superChainSmartAccount.data.smartAccount)
      : undefined
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [customValue, setCustomValue] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<keyof typeof tokens>('CELO')
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const nounSeed = useMemo(() => {
    return {
      background: Number(superChainSmartAccount.data.noun[0]),
      body: Number(superChainSmartAccount.data.noun[1]),
      accessory: Number(superChainSmartAccount.data.noun[2]),
      head: Number(superChainSmartAccount.data.noun[3]),
      glasses: Number(superChainSmartAccount.data.noun[4]),
    }
  }, [superChainSmartAccount])
  const handleCustomValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(event.target.value)
    setSelectedValue(null)
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const handleTopUpClick = () => {
    const value =
      selectedValue !== null
        ? parseUnits(tokens[selectedToken].values[selectedValue].toString(), tokens[selectedToken].decimals)
        : parseUnits(customValue, tokens[selectedToken].decimals)
    handleTopUp(value, tokens[selectedToken])
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet?.address) {
        if (selectedToken === 'ETH') {
          return
        } else {
          const balance = await publicClient.readContract({
            address: tokens[selectedToken].address as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [wallet.address as Address],
          })
          setTokenBalance(Number(balance) / 10 ** tokens[selectedToken].decimals)
        }
      }
    }

    fetchBalance()
  }, [wallet, selectedToken])

  const classes = useStyles()

  return (
    <ModalDialog hideChainIndicator dialogTitle="Top-up your account" open={open} onClose={onClose}>
      <Grid>
        <Grid item xs={12}>
          <Box display="flex" gap={2} className={classNames(css.container, css.optimismBadge)}>
            <Image
              src="https://safe-transaction-assets.safe.global/chains/42220/chain_logo.png"
              alt="Celo logo"
              width={24}
              height={24}
              loading="lazy"
            />
            <p>
              <strong>Celo network</strong>— only send Celo assets to this Account.
            </p>
          </Box>
        </Grid>
        <Grid item>
          <Box className={classNames(css.container, css.description)}>
            This is the address of your Prosperity Passport. Deposit funds by topping up or copying the address below.
            Only send CELO and tokens (e.g. ERC20, ERC721) to this address.
          </Box>
        </Grid>
        <Grid item>
          <Box
            justifyContent="flex-start"
            gap={2}
            flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
            alignItems="center"
            display="flex"
            className={css.container}
          >
            <Select
              className={classes.select}
              onChange={(event) => setSelectedToken(event.target.value as keyof typeof tokens)}
              inputProps={{
                classes: {
                  icon: classes.icon,
                  root: classes.root,
                },
              }}
              value={selectedToken}
            >
              <MenuItem value="CELO">
                <Box pr={1} display="flex" gap={1}>
                  <SvgIcon inheritViewBox component={Celo} />
                  CELO
                </Box>
              </MenuItem>
            </Select>
            {tokens[selectedToken].values.map((value, index) => (
              <Button
                key={index}
                onClick={() => setSelectedValue(index)}
                disabled={selectedToken === 'ETH' ? value > Number(wallet?.balance) : value > tokenBalance}
                className={css.amountButton}
                style={{
                  maxWidth: '50px',
                }}
                variant={selectedValue === index ? 'contained' : 'outlined'}
              >
                {value}
              </Button>
            ))}
            <TextField
              variant="outlined"
              placeholder="0.2"
              value={customValue}
              onSelect={() => setSelectedValue(null)}
              onChange={handleCustomValueChange}
              className={css.amountButton}
              style={{
                textAlign: 'center',
              }}
            />
            <Button
              className={css.topUpButton}
              onClick={handleTopUpClick}
              variant="contained"
              color="secondary"
              disabled={
                selectedValue === null &&
                (customValue === '' ||
                  Number(customValue) === 0 ||
                  (selectedToken === 'ETH'
                    ? Number(customValue) > Number(wallet?.balance ?? '0')
                    : Number(customValue) > tokenBalance))
              }
            >
              Top up
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          {!superChainSmartAccount.loading && (
            <Box display="flex" gap={2} alignItems="center" className={css.container}>
              <div className={css.noun}>
                <NounsAvatar seed={nounSeed} />
              </div>
              <Box>
                <p>{superChainSmartAccount.data.superChainID}</p>
                <Box display="flex" width="100%" lineHeight={1.2} gap={1}>
                  <p>
                    <strong>ceth:</strong>
                    {isMobile
                      ? shortenAddress(superChainSmartAccount.data.smartAccount, 4)
                      : superChainSmartAccount.data.smartAccount}
                  </p>
                  <CopyButton text={superChainSmartAccount.data.smartAccount} />
                  <Box color="border.main">
                    <ExplorerButton {...blockExplorerLink} />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </ModalDialog>
  )
}

export default TopUp
