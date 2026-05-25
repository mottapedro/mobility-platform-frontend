'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPassengerNetwork, getPassengerNetworkHierarchy } from '../services/passengers'
import { ApiError } from '../services/api'
import type { PassengerNetwork, PassengerNetworkHierarchy } from '../types'

interface UsePassengerNetworkResult {
  data: PassengerNetwork | null
  hierarchy: PassengerNetworkHierarchy | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function usePassengerNetwork(passengerId: string | null): UsePassengerNetworkResult {
  const [data, setData] = useState<PassengerNetwork | null>(null)
  const [hierarchy, setHierarchy] = useState<PassengerNetworkHierarchy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNetwork = useCallback(async () => {
    if (!passengerId) return
    setLoading(true)
    setError(null)

    try {
      const [networkResult, hierarchyResult] = await Promise.allSettled([
        getPassengerNetwork(passengerId),
        getPassengerNetworkHierarchy(passengerId),
      ])

      if (networkResult.status === 'rejected') {
        const err = networkResult.reason
        // 404 = passenger has no network data yet — show empty state, not error
        if (err instanceof ApiError && err.status === 404) {
          setData(null)
          setHierarchy(null)
          return
        }
        throw err
      }

      setData(networkResult.value)

      if (hierarchyResult.status === 'fulfilled') {
        const h = hierarchyResult.value
        // Normalise: if backend returns empty array instead of object, treat as null
        setHierarchy(Array.isArray(h) && h.length === 0 ? null : h)
      } else {
        setHierarchy(null)
      }
    } catch {
      setError('Não foi possível carregar sua rede agora.')
    } finally {
      setLoading(false)
    }
  }, [passengerId])

  useEffect(() => {
    fetchNetwork()
  }, [fetchNetwork])

  return { data, hierarchy, loading, error, refresh: fetchNetwork }
}
