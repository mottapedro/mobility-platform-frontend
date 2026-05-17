'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPassengerNetwork, getPassengerNetworkHierarchy } from '../services/passengers'
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
        throw networkResult.reason
      }

      setData(networkResult.value)
      setHierarchy(hierarchyResult.status === 'fulfilled' ? hierarchyResult.value : null)
    } catch {
      setError('Nao foi possivel carregar sua rede agora.')
    } finally {
      setLoading(false)
    }
  }, [passengerId])

  useEffect(() => {
    fetchNetwork()
  }, [fetchNetwork])

  return { data, hierarchy, loading, error, refresh: fetchNetwork }
}
