import { useEffect } from 'react'
import {
  GAS_PRICE_TYPE,
  getChainsConfig,
  RPC_AUTHENTICATION,
  setBaseUrl,
  type ChainInfo,
} from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import { logError, Errors } from '@/services/exceptions'

const celoChain: ChainInfo = {
  chainId: '42220',
  chainName: 'Celo',
  description: 'Celo mainnet',
  chainLogoUri: '/images/currencies/celo.svg',
  l2: false,
  isTestnet: false,
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
    logoUri: '/images/currencies/celo.svg',
  },
  transactionService: '',
  blockExplorerUriTemplate: {
    address: 'https://explorer.celo.org/address/{{address}}',
    txHash: 'https://explorer.celo.org/tx/{{txHash}}',
    api: '',
  },
  disabledWallets: [],
  ensRegistryAddress: undefined,
  features: [],
  gasPrice: [
    {
      type: GAS_PRICE_TYPE.FIXED,
      weiValue: '1000000000',
    },
  ],
  publicRpcUri: {
    authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
    value: 'https://forno.celo.org',
  },
  rpcUri: {
    authentication: RPC_AUTHENTICATION.API_KEY_PATH,
    value: 'https://celo-mainnet.infura.io/v3/',
  },
  safeAppsRpcUri: {
    authentication: RPC_AUTHENTICATION.API_KEY_PATH,
    value: 'https://celo-mainnet.infura.io/v3/',
  },
  shortName: 'celo',
  theme: {
    textColor: '#ffffff',
    backgroundColor: '#35D07F',
  },
}

const getConfigs = async (): Promise<ChainInfo[]> => {
  setBaseUrl('https://safe-client.safe.global')
  const data = await getChainsConfig()
  const results = data.results || []
  const hasCelo = results.some((c) => c.chainId === '42220')
  return hasCelo ? results : [...results, celoChain]
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
