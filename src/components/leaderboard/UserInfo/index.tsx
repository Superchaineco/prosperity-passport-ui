import { Box, IconButton, Skeleton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { UserResponse } from '@/types/super-chain'
import Close from '@/public/images/common/close.svg'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import NounsAvatar from '@/components/common/NounsAvatar'
import ExplorerButton from '@/components/common/ExplorerButton'
import { getBlockExplorerLink } from '@/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import Badges from '@/components/superChain/Badges'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import AddContactIcon from '@/public/images/common/add-contact.svg'
import CopyIcon from '@/public/images/common/copy.svg'
import CompletedIcon from '@/public/images/common/completed.svg'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import { upsertContact } from '@/store/contactsSlice'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import useContacts from '@/hooks/useContacts'

function UserInfo({
  context,
  isLoading,
  handleClose,
}: {
  context?: UserResponse
  isLoading: boolean
  handleClose: () => void
}) {
  const chainId = useChainId()
  const dispatch = useAppDispatch()
  const chain = useCurrentChain()
  const addressBook = useAddressBook()
  const contacts = useContacts()
  const mergedEntries = useMemo(() => {
    return Object.keys(addressBook).reduce((acc, address) => {
      const addressBookEntry = addressBook[address] as any
      const contactEntry = contacts[address] as any
      if (contacts[address]) {
        acc[address] = {
          ...addressBookEntry,
          ...contactEntry,
        }
      } else {
        acc[address] = addressBook[address]
      }
      return acc
    }, {} as { [key: string]: any })
  }, [addressBook, contacts])
  const mergedEntriesArray = Object.entries(mergedEntries)
  const blockExplorerLink =
    chain && context ? getBlockExplorerLink(chain, context.superchainsmartaccount[0]) : undefined

  const nounSeed = useMemo(() => {
    if (!context || isLoading) return null
    return {
      background: parseInt(context!.superchainsmartaccount[4][0]),
      body: parseInt(context!.superchainsmartaccount[4][1]),
      accessory: parseInt(context!.superchainsmartaccount[4][2]),
      head: parseInt(context!.superchainsmartaccount[4][3]),
      glasses: parseInt(context!.superchainsmartaccount[4][4]),
    }
  }, [context])

  const handleAddContact = async () => {
    if (!context?.superchainsmartaccount) return
    dispatch(
      upsertAddressBookEntry({
        chainId,
        address: context?.superchainsmartaccount[0]!,
        name: context?.superchainsmartaccount[1].split('.prosperity')[0]!,
      }),
    )
    dispatch(
      upsertContact({
        address: context.superchainsmartaccount[0],
        name: context?.superchainsmartaccount[1].split('.prosperity')[0]!,
        chainId,
        superChainAccount: context?.superchainsmartaccount
          ? {
              id: context?.superchainsmartaccount[1]!,
              nounSeed: nounSeed!,
            }
          : undefined,
      }),
    )
  }
  const isContact = context && mergedEntries[context?.superchainsmartaccount[0]] !== undefined

  return (
    <Stack padding="24px" justifyContent="flex-start" alignItems="center" spacing={2} className={css.drawer}>
      {isLoading || !context ? (
        <>
          <Box display="flex" justifyContent="center" width="100%" position="relative" marginTop="24px !important">
            <Box display="flex" gap={1} position="absolute" color="grayText" top="-5%" right="-5%">
              <ExplorerButton {...blockExplorerLink} color="inherit" />
              <IconButton onClick={() => handleClose()}>
                <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
              </IconButton>
            </Box>
            <Box
              borderRadius="6px"
              display="flex"
              width="120px"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              border={2}
              borderColor="secondary.main"
            >
              <Skeleton variant="rectangular" width={120} height={120} />
              <Box width="100%" padding="12px" display="flex" justifyContent="center" bgcolor="secondary.main">
                <Skeleton variant="text">
                  <Typography textAlign="center" color="white">
                    Level: <strong>4</strong>
                  </Typography>
                </Skeleton>
              </Box>
            </Box>
          </Box>
          <Skeleton variant="text">
            <Typography display="flex" alignItems="center" fontWeight={600} fontSize={20}>
              potatohead
              <Typography component="span" fontSize="inherit" fontWeight="inherit" color="secondary.main">
                .prosperity
              </Typography>
            </Typography>
          </Skeleton>
          <Skeleton variant="rounded" width={100} height={40} />
          <Box
            display="flex"
            paddingTop={2}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap="20px"
          >
            <Skeleton variant="text" width={100} height={30} />
            <Box display="flex" gap="12px">
              {Array.from(new Array(3)).map((_, index) => (
                <Skeleton key={index} variant="circular" width={60} height={60} />
              ))}
            </Box>
          </Box>
        </>
      ) : (
        <>
          <Box display="flex" justifyContent="center" width="100%" position="relative" marginTop="24px !important">
            <Box display="flex" gap={1} position="absolute" color="grayText" top="-5%" right="-5%">
              <ExplorerButton {...blockExplorerLink} color="inherit" />
              <IconButton onClick={() => handleClose()}>
                <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
              </IconButton>
            </Box>
            <Box
              borderRadius="6px"
              display="flex"
              width="120px"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              border={2}
              borderColor="secondary.main"
            >
              <NounsAvatar seed={nounSeed!} className={css.avatar} />

              <Box width="100%" padding="12px" bgcolor="secondary.main">
                <Typography textAlign="center" color="white">
                  Level: <strong>{parseInt(context?.superchainsmartaccount[3])}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>
          <Stack direction="row" gap={1}>
            <Typography display="flex" alignItems="center" fontWeight={600} fontSize={20}>
              {context?.superchainsmartaccount[1].split('.prosperity')[0]}
              <Typography component="span" fontSize="inherit" fontWeight="inherit" color="secondary.main">
                .prosperity
              </Typography>
            </Typography>
            <Stack direction="row" fontSize="20px">
              <CopyAddressButton address={context.superchainsmartaccount[0]}>
                <IconButton aria-label="Copy address" size="small">
                  <SvgIcon data-testid="copy-btn-icon" component={CopyIcon} inheritViewBox fontSize="inherit" />
                </IconButton>
              </CopyAddressButton>
              {isContact ? (
                <Tooltip title="Added">
                  <IconButton size="small">
                    <SvgIcon inheritViewBox component={CompletedIcon} fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Add contact">
                  <IconButton size="small" onClick={handleAddContact}>
                    <SvgIcon inheritViewBox component={AddContactIcon} fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
          <Box
            display="flex"
            gap={1}
            justifyContent="center"
            alignItems="center"
            padding="8px 14px"
            borderRadius="6px"
            bgcolor="#ECF0F7"
          >
            <strong>{context?.superchainsmartaccount[2]}</strong>
            <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="medium" />
          </Box>
          <Box
            display="flex"
            paddingTop={2}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap="20px"
          >
            <Typography fontWeight={600} fontSize={20}>
              Badges ({context?.badges.reduce((acc, badge) => acc + parseInt(badge.tier), 0)})
            </Typography>
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap="12px">
              <Badges badges={context.badges} />
            </Box>
          </Box>
        </>
      )}
    </Stack>
  )
}

export default UserInfo
