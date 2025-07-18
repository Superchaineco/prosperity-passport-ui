import { useEffect } from 'react'
import {
  FEATURES,
  GAS_PRICE_TYPE,
  getChainsConfig,
  RPC_AUTHENTICATION,
  setBaseUrl,

  type ChainInfo,
} from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import { logError, Errors } from '@/services/exceptions'


const getConfigs = async (): Promise<ChainInfo[]> => {
  const data = await fetch('https://safe-client.safe.global/v1/chains?cursor=limit=40')
  const json = await data.json()
  return json.results || []
}

export const useLoadChains = (): AsyncResult<ChainInfo[]> => {
  const [data, error, loading] = useAsync<ChainInfo[]>(getConfigs, [])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._620, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadChains
