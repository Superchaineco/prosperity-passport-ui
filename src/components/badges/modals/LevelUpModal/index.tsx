import React from 'react'
import { Box, Button, Dialog, Typography } from '@mui/material'
import css from './styles.module.css'
import StarAnimation from '../StarsAnimation'
import Perks from '@/components/superChain/Perks'
import { useQuery } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'
import Image from 'next/image'

function LevelUpModal({ open, onClose, level }: { open: boolean; onClose: () => void; level: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['levelUpModal', level],
    queryFn: async () => badgesService.getPerksByLevel(level),
  })

  return (
    <>
      <Dialog
        className={css.claimModal}
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          display="flex"
          flexDirection="column"
          padding="36px 24px 36px 24px"
          justifyContent="center"
          alignItems="center"
        >
          <Box gap="12px" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Typography id="modal-modal-title" fontSize={24} fontWeight={600} component="h2">
              You’ve reached level
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center" sx={{ p: '20px' }}>
              <Image src="/images/badges/star.svg" alt="Badge" width={50} height={50} />

              <Typography
                variant="h3"
                fontWeight={700}
                color="white"
                sx={{
                  position: 'absolute',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'transparent',
                  pt: '50px',
                }}
              >
                {level}
              </Typography>
            </Box>
            <Typography color="GrayText" id="modal-modal-description" fontSize={16}>
              You have unlocked the following perks:
            </Typography>
          </Box>

          <Perks data={data} isLoading={isLoading} />
          <Button
            onClick={onClose}
            variant="contained"
            sx={{ width: '100%', mt: '30px', borderRadius: '30px', height: '60px' }}
          >
            Return to Dashboard
          </Button>
        </Box>

        {/* <StarAnimation /> */}
      </Dialog>
    </>
  )
}

export default LevelUpModal
