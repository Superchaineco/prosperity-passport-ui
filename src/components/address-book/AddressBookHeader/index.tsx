import { Button, SvgIcon, Grid, ButtonProps } from '@mui/material'
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
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
                borderRadius: '6px',
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
          </Grid>

          <Grid item xs={12} md={4} display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
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
