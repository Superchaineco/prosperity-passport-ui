import { Box, Divider, Grid, IconButton, Paper, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
// import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
// import CurrencySelect from '@/components/balances/CurrencySelect'
// import TokenListSelect from '@/components/balances/TokenListSelect'
import MoreIcon from '@/public/images/common/more.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '../EthHashInfo'
import AddEOAModal from '@/components/superChain/AddEOAModal'
import { useState } from 'react'
import usePopulatedEOASRequest from '@/hooks/super-chain/usePopulatedEOASRequest'
import type { Address } from 'viem'
import RemovePopulateModal from '@/components/superChain/RemovePopulateModal'
export const ADD_EOA_INITIAL_STATE = {
  open: false,
  currentAmountOfPopulatedOwners: 0,
}
export const REMOVE_POPULATE_INITIAL_STATE = {
  open: false,
  address: '',
}
const SuperChainEOAS = () => {
  const { safe } = useSafeInfo()
  const [removePopulateContext, setRemovePopulateContext] = useState(REMOVE_POPULATE_INITIAL_STATE)
  const [addEOAContext, setAddEOAContext] = useState(ADD_EOA_INITIAL_STATE)
  const {
    data: populatedOwners,
    loading: populatedOwnersLoading,
    updateQuery,
  } = usePopulatedEOASRequest(safe.address.value as Address)
  return (
    <div className={css.container}>
      <Typography fontWeight={600} fontSize={16} marginBottom={1}>
        Account
      </Typography>
      <Paper
        style={{
          height: '100%',
        }}
      >
        <Grid container gap={2} height="100%" alignItems="center" justifyContent="center" flexDirection="column">
          <Box height="100%" width="100%">
            <Box
              p={2}
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              width="100%"
              flexDirection="row"
            >
              <Typography fontSize={16} fontWeight="600">
                Connected Wallets
              </Typography>
              <IconButton
                disabled={populatedOwnersLoading}
                onClick={() =>
                  setAddEOAContext({
                    open: true,
                    currentAmountOfPopulatedOwners: populatedOwners?.ownerPopulateds?.length || 0,
                  })
                }
                size="small"
              >
                <SvgIcon component={MoreIcon} inheritViewBox fontSize="medium" />
              </IconButton>
            </Box>
            <Divider />
            <Box
              p={2}
              gap={2}
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              width="100%"
              flexDirection="column"
            >
              {safe.owners.map((owner, key) => (
                <EthHashInfo
                  avatarSize={30}
                  key={key}
                  address={owner.value}
                  showCopyButton
                  prefix=""
                  shortAddress={false}
                  showName={false}
                  hasExplorer
                />
              ))}
              {populatedOwners?.ownerPopulateds?.map((owner: { newOwner: string }, key: number) => (
                <EthHashInfo
                  isPopulated={true}
                  avatarSize={30}
                  setRemovePopulateContext={setRemovePopulateContext}
                  key={key}
                  shortAddressSize={2}
                  address={owner.newOwner}
                  showCopyButton
                  prefix=""
                  shortAddress={false}
                  showName={false}
                  hasExplorer
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Paper>
      <RemovePopulateModal
        updateQuery={updateQuery}
        context={removePopulateContext}
        onClose={() => setRemovePopulateContext(REMOVE_POPULATE_INITIAL_STATE)}
      />
      <AddEOAModal
        updateQuery={updateQuery}
        context={addEOAContext}
        onClose={() => setAddEOAContext(ADD_EOA_INITIAL_STATE)}
      />
    </div>
  )
}

export default SuperChainEOAS
