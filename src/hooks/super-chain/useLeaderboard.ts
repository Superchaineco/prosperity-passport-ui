import { gql, useApolloClient, useLazyQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { Address } from 'viem'
import useSafeAddress from '../useSafeAddress'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import { useInfiniteQuery } from '@tanstack/react-query'

export type Leaderboard = {
  superChainSmartAccounts: {
    points: string
    level: string
    safe: string
    superChainId: string
    nationality?: string
    badges: {
      id: string
      tier: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }[]
  superChainSmartAccount: {
    points: string
    level: string
    superChainId: string
    nationality?: string
    badges: {
      id: string
      tier: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }
}

function getTimestampForLastWeek(): number {
  return Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 // Unix timestamp for one week ago
}

interface NationalityBatchResponse {
  [address: string]: string
}

async function fetchNationalities(safeAddresses: string[]): Promise<Record<string, string>> {
  const normalizedAddresses = Array.from(new Set(safeAddresses.map((addr) => addr.trim())))

  try {
    const response = await axios.post<NationalityBatchResponse>(
      `${BACKEND_BASE_URI}/leaderboard/nationalities`,
      { addresses: normalizedAddresses },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      },
    )

    const nationalities: Record<string, string> = {}

    normalizedAddresses.forEach((address) => {
      nationalities[address] = response.data[address] || 'UNKNOWN'
    })

    return nationalities
  } catch (error) {
    console.error('Error fetching nationalities:', error)

    if (axios.isAxiosError(error)) {
      console.error('Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }

    const fallback: Record<string, string> = {}
    normalizedAddresses.forEach((address) => {
      fallback[address] = 'UNKNOWN'
    })

    return fallback
  }
}

const GET_LEADERBOARD = gql`
  query GetLeaderboard($userId: String, $skip: Int) {
    superChainSmartAccounts(first: 20, skip: $skip, orderBy: points, orderDirection: desc) {
      points
      safe
      level
      superChainId
      badges {
        id
        tier
      }
      noun_body
      noun_head
      noun_glasses
      noun_accessory
      noun_background
    }
    superChainSmartAccount(id: $userId) {
      points
      id
      level
      superChainId
      badges {
        id
        tier
      }
      noun_body
      noun_head
      noun_glasses
      noun_accessory
      noun_background
    }
  }
`

export function useLeaderboard(userId: Address) {
  const client = useApolloClient()
  const safeAddress = useSafeAddress()

  return useInfiniteQuery({
    queryKey: ['leaderboard', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await client.query({
        query: GET_LEADERBOARD,
        variables: {
          skip: pageParam,
          userId: userId.toLowerCase(),
        },
        fetchPolicy: 'network-only',
      })

      const safeAddresses = [
        ...data.superChainSmartAccounts.map((a: any) => a.safe),
        ...(pageParam === 0 ? [safeAddress] : []), // solo en primera página
      ].filter(Boolean)

      let nationalities: Record<string, string> = {}
      try {
        nationalities = await fetchNationalities(safeAddresses)
      } catch (err) {
        console.error('Error fetching nationalities:', err)
      }

      const users = data.superChainSmartAccounts.map((account: any) => ({
        ...account,
        nationality: nationalities[account.safe.toUpperCase()],
      }))

      const mainUser =
        pageParam === 0 && data.superChainSmartAccount
          ? {
            ...data.superChainSmartAccount,
            nationality: nationalities[safeAddress.toUpperCase()],
          }
          : undefined

      return {
        users,
        user: mainUser,
        nextSkip: data.superChainSmartAccounts.length === 20 ? pageParam + 20 : undefined,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextSkip,
  })
}

export type WeeklyLeaderboard = {
  superChainSmartAccounts: {
    points: string
    safe: string
    superChainId: string
    level: string
    badges: {
      id: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }[]
}

export function useWeeklyLeaderboard(): { loading: boolean; error: any; leaderboard: WeeklyLeaderboard } {
  const lastWeekTimestamp = getTimestampForLastWeek()
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard>({ superChainSmartAccounts: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<any>(null)

  const GET_RECENT_POINTS_INCREMENTS = gql`
    query GetRecentPointsIncrements($lastWeekTimestamp: BigInt!, $skip: Int!) {
      pointsIncrementeds(
        where: { blockTimestamp_gte: $lastWeekTimestamp }
        orderBy: blockTimestamp
        orderDirection: desc
        first: 1000
        skip: $skip
      ) {
        id
        superChainSmartAccount {
          safe
          superChainId
          noun_background
          noun_body
          noun_accessory
          noun_head
          noun_glasses
          level
        }
        points
        blockTimestamp
      }
    }
  `

  const [fetchPointsIncrements, { data, fetchMore, loading: queryLoading, error: queryError }] =
    useLazyQuery(GET_RECENT_POINTS_INCREMENTS)

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      const pointsMap = new Map<string, any>()
      let skip = 0
      let hasMore = true

      while (hasMore) {
        const { data } = await fetchPointsIncrements({
          variables: {
            lastWeekTimestamp: 1722371655,
            skip,
          },
        })

        if (data) {
          data.pointsIncrementeds.forEach((event: any) => {
            const recipient = event.superChainSmartAccount.safe.toLowerCase()
            const points = parseInt(event.points, 10)

            if (pointsMap.has(recipient)) {
              pointsMap.set(recipient, {
                ...pointsMap.get(recipient),
                points: pointsMap.get(recipient).points + points,
              })
            } else {
              pointsMap.set(recipient, {
                points,
                safe: recipient,
                superChainId: event.superChainSmartAccount.superChainId,
                level: event.superChainSmartAccount.level,
                badges: [], // Asumimos que los badges no se manejan aquí
                noun_body: event.superChainSmartAccount.noun_body,
                noun_head: event.superChainSmartAccount.noun_head,
                noun_glasses: event.superChainSmartAccount.noun_glasses,
                noun_accessory: event.superChainSmartAccount.noun_accessory,
                noun_background: event.superChainSmartAccount.noun_background,
              })
            }
          })

          skip += 1000
          hasMore = data.pointsIncrementeds.length === 1000
        } else {
          hasMore = false
        }

        if (queryError) {
          setError(queryError)
          hasMore = false
        }
      }

      // Convertir el mapa a una matriz, ordenarlo por puntos, y tomar los top 10
      const sortedUsers = Array.from(pointsMap.values())
        .sort((a, b) => b.points - a.points) // Ordenar de mayor a menor
        .slice(0, 20) // Tomar los top 10

      setLeaderboard({ superChainSmartAccounts: sortedUsers })
      setLoading(false)
    }

    fetchAllData()
  }, [fetchPointsIncrements, lastWeekTimestamp, queryError])

  return { loading, error, leaderboard }
}
