import { Button, SvgIcon, Grid, ButtonProps, Box } from '@mui/material'
import type { ReactElement, ElementType } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@/public/images/common/search.svg'
import TextField from '@mui/material/TextField'

import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import PageHeader from '@/components/common/PageHeader'
import { ModalType } from '../AddressBookTable'
import { useAppSelector } from '@/store'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import mapProps from '@/utils/mad-props'

interface HeaderButtonProps extends ButtonProps {
  icon: ElementType
  onClick: () => void
  disabled?: boolean
  children: string
}

const HeaderButton = ({ icon, onClick, disabled, children, ...props }: HeaderButtonProps): ReactElement => {
  const svg = <SvgIcon component={icon} inheritViewBox fontSize="small" />

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="text"
      color="primary"
      size="small"
      startIcon={svg}
      {...props}
    >
      {children}
    </Button>
  )
}

type Props = {
  allAddressBooks: AddressBookState
  handleOpenModal: (type: ModalType) => () => void
  searchQuery: string
  onSearchQueryChange: (searchQuery: string) => void
}

function AddressBookHeader({
  allAddressBooks,
  handleOpenModal,
  searchQuery,
  onSearchQueryChange,
}: Props): ReactElement {
  const canExport = Object.values(allAddressBooks).some((addressBook) => Object.keys(addressBook || {}).length > 0)

  return (
    <PageHeader
      title="Contacts"
      noBorder
      action={
        <Grid container pb={1} spacing={1}>
          <Grid item xs={12} mt={1} xl={5.5}>
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                placeholder="Search"
                variant="filled"
                hiddenLabel
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                    </InputAdornment>
                  ),
                  disableUnderline: true,
                }}
                fullWidth
                size="medium"
                sx={{
                  width: '500px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  '& .MuiFilledInput-root': {
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    paddingX: '12px',
                    height: '54px',
                    '&:hover': {
                      backgroundColor: '#E0E0E0',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                    },
                    '& input': {
                      padding: '4px 0',
                      '&::placeholder': {
                        fontSize: '14px',
                        color: '#6B6B6B',
                        opacity: 1,
                      },
                    },
                  },
                }}
              />

              {/* <Box
                component="button"
                onClick={() => {
                  onSearchQueryChange('')
                }}
                sx={{
                  borderRadius: '6px',
                  minWidth: '100px',
                  height: '54px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: 'black',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#E0E0E0',
                  },
                }}
              >
                Clear All
              </Box> */}
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={7}
            xl={6.5}
            display="flex"
            justifyContent={['space-between', , 'flex-end']}
            alignItems="center"
          >
            {/* <Track {...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON}> */}
            {/*   <HeaderButton onClick={handleOpenModal(ModalType.IMPORT)} icon={ImportIcon}> */}
            {/*     Import */}
            {/*   </HeaderButton> */}
            {/* </Track> */}
            {/**/}
            {/* <Track {...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON}> */}
            {/*   <HeaderButton onClick={handleOpenModal(ModalType.EXPORT)} icon={ExportIcon} disabled={!canExport}> */}
            {/*     Export */}
            {/*   </HeaderButton> */}
            {/* </Track> */}

            <Track {...ADDRESS_BOOK_EVENTS.CREATE_ENTRY}>
              <HeaderButton
                onClick={handleOpenModal(ModalType.ENTRY)}
                icon={AddCircleOutlineIcon}
                size="medium"
                variant="outlined"
              >
                Add contact
              </HeaderButton>
            </Track>
          </Grid>
        </Grid>
      }
    />
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default mapProps(AddressBookHeader, {
  allAddressBooks: useAllAddressBooks,
})
