import { Box, Chip, Divider, IconButton, Skeleton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
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
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import { upsertContact } from '@/store/contactsSlice'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import useContacts from '@/hooks/useContacts'
import ContactAdded from '@/public/images/common/contact-added.svg'
import { getNounData } from '@nouns/assets'
import CountryFlag from '@/components/countryFlag'

function UserInfo({
  context,
  rank,
  isLoading,
  handleClose,
  nationality,
}: {
  context?: UserResponse
  rank: number
  isLoading: boolean
  handleClose: () => void
  nationality: string | undefined
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

  const background = useMemo(() => {
    if (!context || isLoading) return '#FFFFFF'
    return '#' + getNounData(nounSeed!).background
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
    <Stack padding="0px" justifyContent="flex-start" spacing={2} className={css.drawer}>
      {isLoading || !context ? (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" padding="12px" paddingBottom={0}>
            <Stack direction="row" gap={1} padding="16px">
              <Skeleton variant="rounded" width={60} height={30} />
              <Skeleton variant="rounded" width={60} height={30} />
            </Stack>
            <Skeleton variant="circular" width={24} height={24} />
          </Stack>

          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            sx={{
              border: '1px solid #E1E2EA',
              backgroundColor: '#FCFCFD',
              paddingY: '20px',
              alignItems: 'center',
            }}
          >
            <Skeleton variant="circular" width={120} height={120} />
            <Skeleton variant="rounded" width={32} height={32} sx={{ mt: 2 }} />
          </Box>

          <Stack sx={{ width: '100%', padding: '10px 28px' }}>
            <Skeleton width={160} height={30} />
            <Stack direction="row" spacing={2} mt={2}>
              <Skeleton variant="rounded" width={80} height={32} />
              <Skeleton variant="rounded" width={80} height={32} />
              <Skeleton variant="rounded" width={80} height={32} />
            </Stack>
          </Stack>

          <Divider sx={{ width: '100%', mt: 2 }} />
          <Box display="flex" justifyContent="center" gap={2} padding={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="circular" width={60} height={60} />
            ))}
          </Box>
        </>
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" padding="12px" paddingBottom={0}>
            <Stack direction="row" gap={1} padding="16px">
              <Chip
                sx={{
                  backgroundColor: 'transparent',
                  border: '1px solid #E1E2EA',
                  borderRadius: '6px',
                  color: 'black',
                  fontSize: '12px',
                  height: '30px',
                  fontWeight: 500,
                  '& .MuiChip-label': {
                    py: 0,
                    px: 1,
                    lineHeight: 0.8,
                  },
                }}
                label={<>Rank: {rank}</>}
              />
            </Stack>

            <IconButton onClick={handleClose}>
              <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
            </IconButton>
          </Stack>
          <Box
            display="flex"
            width="100%"
            flexDirection="column"
            sx={{
              border: '1px solid #E1E2EA',
              backgroundColor: { background },
              verticalAlign: 'bottom',
              position: 'relative',
            }}
          >
            <Box sx={{ maxWidth: '150px', alignSelf: 'center', m: '0px', p: '0px' }}>
              <NounsAvatar seed={nounSeed!} className={css.avatar} />
            </Box>
            {isContact ? (
              <Tooltip title="Added">
                <IconButton
                  size="medium"
                  onClick={handleAddContact}
                  sx={{
                    position: 'absolute',
                    top: '110px',
                    left: '290px',
                    height: '34px',
                    width: '34px',
                    borderRadius: '50px',
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#121312',
                    },
                  }}
                >
                  <SvgIcon
                    inheritViewBox
                    component={ContactAdded}
                    fontSize="small"
                    sx={{ stroke: 'white', fill: 'white' }}
                  />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Add contact">
                <IconButton
                  size="medium"
                  onClick={handleAddContact}
                  sx={{
                    position: 'absolute',
                    top: '110px',
                    left: '290px',
                    height: '34px',
                    width: '34px',
                    borderRadius: '6px',
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#121312',
                    },
                  }}
                >
                  <SvgIcon
                    inheritViewBox
                    component={AddContactIcon}
                    fontSize="small"
                    sx={{ stroke: 'white', fill: 'white' }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Stack sx={{ alignSelf: 'left', width: '100%', padding: '10px 28px' }}>
            <Stack direction="row" gap={1} sx={{ padding: '10px 0px' }}>
              <Typography display="flex" alignItems="center" fontWeight={600} fontSize={20}>
                {context?.superchainsmartaccount[1].split('.prosperity')[0]}
                <Typography component="span" fontSize="inherit" fontWeight="inherit" color="secondary.main">
                  .prosperity
                </Typography>
              </Typography>

              <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" fontSize="20px">
                <Box display="flex" alignItems="center">
                  <CopyAddressButton address={context.superchainsmartaccount[0]}>
                    <IconButton aria-label="Copy address" size="small">
                      <SvgIcon data-testid="copy-btn-icon" component={CopyIcon} inheritViewBox fontSize="inherit" />
                    </IconButton>
                  </CopyAddressButton>
                  <ExplorerButton {...blockExplorerLink} color="inherit" />
                </Box>
              </Stack>
            </Stack>
            <Stack direction="row" gap={1} sx={{ alignSelf: 'left', width: '100%' }}>
              {nationality != 'UNKNOWN' ? (
                <Chip
                  title={nationality}
                  sx={{
                    backgroundColor: 'transparent',
                    border: '1px solid #E1E2EA',
                    borderRadius: '6px',
                    color: 'black',
                    fontSize: '12px',
                    fontWeight: 500,
                    height: '30px',
                    '& .MuiChip-label': {
                      px: '8px',
                    },
                  }}
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CountryFlag alpha3={nationality ?? ''} size={24} />
                    </Box>
                  }
                ></Chip>
              ) : (
                ''
              )}
              <Chip
                sx={{
                  backgroundColor: 'transparent',
                  border: '1px solid #E1E2EA',
                  borderRadius: '6px',
                  color: 'black',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '30px',
                }}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {context?.superchainsmartaccount[2]}
                    <SvgIcon
                      component={ProsperityPassportPoints}
                      inheritViewBox
                      fontSize="medium"
                      width={20}
                      height={20}
                    />
                  </Box>
                }
              ></Chip>
              <Chip
                sx={{
                  backgroundColor: 'transparent',
                  border: '1px solid #E1E2EA',
                  color: 'black',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '30px',
                }}
                label={<Box textAlign="center">Level: {parseInt(context?.superchainsmartaccount[3])}</Box>}
              ></Chip>

              <Chip
                sx={{
                  backgroundColor: 'transparent',
                  border: '1px solid #E1E2EA',
                  color: 'black',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '30px',
                }}
                label={
                  <Box textAlign="center">
                    Badges: {context?.badges.reduce((acc, badge) => acc + parseInt(badge.tier), 0)}
                  </Box>
                }
              ></Chip>
            </Stack>
          </Stack>
          <Divider sx={{ width: '100%' }}></Divider>
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
