import { useState, useEffect, useCallback } from 'react'
import type {
  SafeAppAccessPolicyTypes,
  SafeAppData,
  SafeAppSocialPlatforms,
} from '@safe-global/safe-gateway-typescript-sdk'
import local from '@/services/local-storage/local'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import useChainId from '@/hooks/useChainId'

type ReturnType = {
  customSafeApps: SafeAppData[]
  loading: boolean
  updateCustomSafeApps: (newCustomSafeApps: SafeAppData[]) => void
}

const CUSTOM_SAFE_APPS_STORAGE_KEY = 'customSafeApps'

const getChainSpecificSafeAppsStorageKey = (chainId: string) => `${CUSTOM_SAFE_APPS_STORAGE_KEY}-${chainId}`

type StoredCustomSafeApp = { url: string }

/*
  This hook is used to manage the list of custom safe apps.
  What it does:
  1. Loads a list of custom safe apps from local storage
  2. Does some backward compatibility checks (supported app networks, etc)
  3. Tries to fetch the app info (manifest.json) from the app url
*/
const useCustomSafeApps = (): ReturnType => {
  const [customSafeApps, setCustomSafeApps] = useState<SafeAppData[]>(fakeSafeApps)
  const [loading, setLoading] = useState(false)
  const chainId = useChainId()

  const updateCustomSafeApps = useCallback(
    (newCustomSafeApps: SafeAppData[]) => {
      setCustomSafeApps(newCustomSafeApps)

      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      local.setItem(
        chainSpecificSafeAppsStorageKey,
        newCustomSafeApps.map((app) => ({ url: app.url })),
      )
    },
    [chainId],
  )

  useEffect(() => {
    const loadCustomApps = async () => {
      setLoading(true)
      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      const storedApps = local.getItem<StoredCustomSafeApp[]>(chainSpecificSafeAppsStorageKey) || []
      const appManifests = await Promise.allSettled(storedApps.map((app) => fetchSafeAppFromManifest(app.url, chainId)))
      const resolvedApps = appManifests
        .filter((promiseResult) => promiseResult.status === 'fulfilled')
        .map((promiseResult) => (promiseResult as PromiseFulfilledResult<SafeAppData>).value)

      setLoading(false)
    }

    loadCustomApps()
  }, [chainId])

  return { customSafeApps, loading, updateCustomSafeApps }
}

export { useCustomSafeApps }

const fakeSafeApps: SafeAppData[] = [
  {
    id: 0.21472726789485663,
    url: 'https://mondo.celo.org',
    name: 'Celo Mondo',
    description:
      "Celo Mondo is a DApp for participating in staking and governance on Celo. Earn rewards by locking & staking your CELO tokens. Help decide Celo's destiny by casting your vote in on-chain governance proposals.",
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    tags: ['Governance'],
    features: [],
    socialProfiles: [],
    developerWebsite: '',
    chainIds: ['42220'],
    iconUrl: 'https://account.celopg.eco/images/apps/mondo.svg',
  },
  {
    id: 0.31472726789485663,
    url: 'https://alpha.regenerative.fi',
    name: 'Regenerative Fi',
    description:
      'A UI that supports core Regenerative protocol functionality. Explore & create pools, manage liquidity, swap tokens and claim incentives.',
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    tags: ['DeFi'],
    features: [],
    socialProfiles: [],
    developerWebsite: '',
    chainIds: ['42220'],
    iconUrl: 'https://account.celopg.eco/images/apps/regenerativeFi.svg',
  },
  {
    id: 109,
    url: 'https://giveth.io',
    name: 'Giveth',
    iconUrl: 'https://safe-transaction-assets.safe.global/safe_apps/109/icon.png',
    description: 'Get rewarded for giving to for-good projects with zero added fees.',
    chainIds: ['42220'],
    tags: ['Donation', 'Infrastructure'],
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    features: [],
    developerWebsite: 'https://giveth.io',
    socialProfiles: [
      {
        platform: 'GITHUB' as SafeAppSocialPlatforms,
        url: 'https://github.com/Giveth/',
      },
      {
        platform: 'TWITTER' as SafeAppSocialPlatforms,
        url: 'https://twitter.com/giveth',
      },
    ],
  },
]
