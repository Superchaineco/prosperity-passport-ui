import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import { useEffect, useMemo } from 'react'
import { getBalances, type SafeBalanceResponse, TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync, { type AsyncResult } from '../useAsync'
import { Errors, logError } from '@/services/exceptions'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '../useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import { BACKEND_BASE_URI, POLLING_INTERVAL } from '@/config/constants'
import useIntervalCounter from '../useIntervalCounter'
import useSafeInfo from '../useSafeInfo'
import axios from 'axios'

const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

const tokensLogoToInject = [
  {
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    logoUri: '/tokens/celo.svg',
  },
  {
    address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    logoUri: '/tokens/usdt.svg',
  },
  {
    address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
    logoUri: '/tokens/usdc.svg',
  },
  {
    address: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
    logoUri: '/tokens/stCelo.svg',
  }
]

const tokensNeedingExternalPrice = [
  {
    address: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
    symbol: 'stCELO'
  }
]

const fetchTokenPrices = async (addresses: string[]): Promise<Record<string, number>> => {
  try {
    const response = await axios.get(`${BACKEND_BASE_URI}/assets/${addresses.join(',')}/prices`);
    return response.data; // Se espera que el backend devuelva un objeto con los precios
  } catch (error) {
    console.error(`Error fetching prices for ${addresses.join(', ')}:`, error);
    return addresses.reduce((acc, address) => ({ ...acc, [address]: 0 }), {}); // Retornar 0 para todos los assets en caso de error
  }
};

export const useLoadBalances = (): AsyncResult<SafeBalanceResponse> => {
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const chainId = safe.chainId

  // Re-fetch assets when the entire SafeInfo updates
  const [data, error, loading] = useAsync<SafeBalanceResponse | undefined>(
    async () => {
      if (!chainId || !safeAddress || isTrustedTokenList === undefined) return

      if (!safe.deployed) {
        return getCounterfactualBalance(safeAddress, web3, chain)
      }

      let balances = await getBalances(chainId, safeAddress, currency, {
        trusted: isTrustedTokenList,
      })

      const addressesNeedingPrices = tokensNeedingExternalPrice.map(t => t.address.toLowerCase());
      const prices = await fetchTokenPrices(addressesNeedingPrices);

      for (const balance of balances.items) {
        const logo = tokensLogoToInject.find(t => t.address.toLowerCase() === balance.tokenInfo.address?.toLowerCase())
        if (logo) {
          balance.tokenInfo.logoUri = logo.logoUri
        }

        const needsPrice = tokensNeedingExternalPrice.find(t => t.address.toLowerCase() === balance.tokenInfo.address?.toLowerCase())
        if (needsPrice) {
          const price = prices[needsPrice.address.toLowerCase()] || 0;
          console.debug({ price });
          if (price > 0) {
            const balanceInDecimal = Number(balance.balance) / Math.pow(10, balance.tokenInfo.decimals)
            balance.fiatBalance = (balanceInDecimal * price).toString()
            balance.fiatConversion = price.toString()
          }
        }
      }


      //Hotfix to handle CELO native vs ERC-20: prefer ERC-20, convert native to ERC-20 if no ERC-20 exists
      const ZERO = '0x0000000000000000000000000000000000000000'
      const CELO_ERC20 = '0x471EcE3750Da237f93B8E339c536989b8978a438'

      // Find native CELO token
      const nativeCeloToken = (balances.items ?? []).find(
        ({ tokenInfo }) => tokenInfo.type === 'NATIVE_TOKEN' && tokenInfo.address?.toLowerCase() === ZERO,
      )

      // Find ERC-20 CELO token
      const erc20CeloToken = (balances.items ?? []).find(
        ({ tokenInfo }) => tokenInfo.type === 'ERC20' && tokenInfo.address?.toLowerCase() === CELO_ERC20.toLowerCase(),
      )

      // Store the native CELO fiat balance before removing it
      const nativeCeloFiatBalance = nativeCeloToken?.fiatBalance ? Number(nativeCeloToken.fiatBalance) : 0

      // Remove native CELO from fiatTotal only if we're NOT converting it to ERC-20
      // or if there's already an ERC-20 CELO (to avoid double counting)
      if (nativeCeloToken && erc20CeloToken) {
        // If both exist, remove native from fiatTotal to avoid duplication
        balances.fiatTotal = (Number(balances.fiatTotal) - nativeCeloFiatBalance).toString()
      }
      // If only native exists, we'll convert it to ERC-20, so keep it in fiatTotal

      // Remove native CELO from the list always
      balances.items = (balances.items ?? []).filter(
        ({ tokenInfo }) => !(tokenInfo.type === 'NATIVE_TOKEN' && tokenInfo.address?.toLowerCase() === ZERO),
      )

      // If there's no ERC-20 CELO but there's native CELO, convert native to ERC-20
      if (!erc20CeloToken && nativeCeloToken) {
        balances.items.push({
          ...nativeCeloToken,
          tokenInfo: {
            type: TokenType.ERC20,
            address: CELO_ERC20,
            decimals: 18,
            symbol: 'CELO',
            name: 'Celo native asset',
            logoUri:
              'https://safe-transaction-assets.safe.global/tokens/logos/0x471EcE3750Da237f93B8E339c536989b8978a438.png',
          },
        })
      }

      balances.items.sort((a, b) => {
        const aHasValue = Number(a.fiatBalance) > 0
        const bHasValue = Number(b.fiatBalance) > 0

        if (aHasValue === bHasValue) {
          return Number(b.fiatBalance) - Number(a.fiatBalance)
        }

        return aHasValue ? -1 : 1
      })

      return balances
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeAddress, chainId, currency, isTrustedTokenList, pollCount, safe.deployed, web3, chain],
    false, // don't clear data between polls
  )

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, safeAddress, chainId])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._601, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadBalances
