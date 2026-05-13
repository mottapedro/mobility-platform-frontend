'use client'

import { useCallback, useEffect, useState } from 'react'
import { getDriverNetwork, getDriverNetworkHierarchy } from '../services/drivers'
import { sanitizeNetworkTree } from '../utils/networkTree'
import type { DriverNetwork, DriverNetworkHierarchy } from '../types'

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

interface UseDriverNetworkHierarchyResult {
  data: DriverNetworkHierarchy | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDriverNetworkHierarchy(driverId: string | null): UseDriverNetworkHierarchyResult {
  const [data, setData] = useState<DriverNetworkHierarchy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHierarchy = useCallback(async () => {
    if (!driverId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getDriverNetworkHierarchy(driverId)
      const sanitized: DriverNetworkHierarchy = {
        ...result,
        referrals: result.referrals.map((node) => sanitizeNetworkTree(node)),
      }
      setData(sanitized)
    } catch {
      setError('Não foi possível carregar a hierarquia da rede.')
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    fetchHierarchy()
  }, [fetchHierarchy])

  return { data, loading, error, refresh: fetchHierarchy }
}
