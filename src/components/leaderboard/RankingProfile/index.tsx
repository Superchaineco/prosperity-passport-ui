import NounsAvatar from '@/components/common/NounsAvatar'
import { Box, Stack, SvgIcon, Typography } from '@mui/material'
import ProsperityPassportPoints from '@/public/images/common/prosperity-passport-points.svg'
import React from 'react'
import { NounProps } from '@/components/new-safe/create/steps/AvatarStep'

type _Props = {
  isMainProfile?: boolean
  position: number
  points: string
  name: string
  level: string
  noun: NounProps
  badges: number
  onClick?: () => void
}

function RankingProfile({ isMainProfile, position, points, name, level, badges, noun, onClick }: _Props) {
  return (
    <Box
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: isMainProfile ? '#C1D1FF' : '#F6F6F8',
        borderRadius: '1000px',
        backgroundColor: isMainProfile ? '#EBF0FF' : '#FCFCFD',
      }}
      onClick={onClick}
      display="flex"
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      borderRadius="6px"
      padding={{
        xs: '4px 8px',
        sm: '8px 24px',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="flex-start">
        <Box
          height={28}
          width={28}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            borderRadius: '50px',
            border: '1px solid',
            borderColor: position == 1 ? '#FFEE05' : position == 2 ? '#D3D4D4' : position == 3 ? '#F2AA7D' : '#F6F6F8',
            backgroundColor:
              position == 1 ? '#F5B800' : position == 2 ? '#A2ACB4' : position == 3 ? '#DB8466' : 'white',
            color: position <= 3 ? 'white' : 'black',
          }}
        >
          <Typography fontWeight={500} fontSize={12}>
            {position}
          </Typography>
        </Box>
        <Stack paddingLeft={{ xs: 0, sm: 6 }} direction="row" alignItems="center" gap={{ xs: '6px', sm: '12px' }}>
          <Box width={32} height={32} borderRadius="6px">
            <NounsAvatar seed={noun} />
          </Box>
          <Typography fontSize={14}>
            <strong>{name.split('.prosperity')[0]}</strong>.prosperity
          </Typography>
          <Box
            display={{ xs: 'none', sm: 'block' }}
            bgcolor="white"
            padding="3px 12px"
            borderRadius="100px"
            sx={{ border: '1px solid #F6F6F8' }}
          >
            <Typography fontSize={12} fontWeight={600} color="black">
              Level: {level}
            </Typography>
          </Box>
          <Box
            display={{ xs: 'none', sm: 'block' }}
            padding="3px 12px"
            borderRadius="100px"
            color="black"
            bgcolor="white"
            sx={{ border: '1px solid #F6F6F8' }}
          >
            <Typography fontSize={12} fontWeight={600}>
              Badges: {badges}
            </Typography>
          </Box>
        </Stack>
      </Stack>
      <Box display="flex" justifyContent="center" alignItems="center" gap="6px">
        <strong>{points}</strong>
        <SvgIcon component={ProsperityPassportPoints} inheritViewBox fontSize="medium" />
      </Box>
    </Box>
  )
}

export default RankingProfile
