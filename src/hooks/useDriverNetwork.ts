'use client'

import { useCallback, useEffect, useState } from 'react'
import { getDriverNetwork } from '../services/drivers'
import type { DriverNetwork } from '../types'

interface UseDriverNetworkResult {
  data: DriverNetwork | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDriverNetwork(driverId: string | null): UseDriverNetworkResult {
  const [data, setData] = useState<DriverNetwork | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNetwork = useCallback(async () => {
    if (!driverId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getDriverNetwork(driverId)
      setData(result)
    } catch {
      setError('Não foi possível carregar sua rede agora.')
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    fetchNetwork()
  }, [fetchNetwork])

  return { data, loading, error, refresh: fetchNetwork }
}
