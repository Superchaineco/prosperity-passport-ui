import { BACKEND_BASE_URI } from '@/config/constants'
import axios from 'axios'

type CheckAirdropEligibilityResponse = {
  eligible: boolean
  value: number
  proofs: string[]
  claimed: boolean
  reasons: string[]
  expiration_date: Date
  airdrop_id: string | null
}

export async function checkAirdropEligibility(address: string): Promise<CheckAirdropEligibilityResponse | null> {
  const response = await axios.get<CheckAirdropEligibilityResponse>(`${BACKEND_BASE_URI}/airdrop/${address}`)
  return response.data
}

export async function airdropClaimed(address: string, airdropId: string, hash: string): Promise<void> {
  await axios.post(`${BACKEND_BASE_URI}/airdrop/${address}`, {
    airdropId,
    hash,
  })
}
