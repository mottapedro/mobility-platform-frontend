'use client'

import { useCallback, useEffect, useState } from 'react'
import { getDriverNetwork, getDriverNetworkHierarchy } from '../services/drivers'
import { ApiError } from '../services/api'
import { sanitizeNetworkTree } from '../utils/networkTree'
import type { DriverNetwork, DriverNetworkHierarchy } from '../types'

function clearStaleDriverId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('driverId')
  const stored = localStorage.getItem('aliado:auth')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      delete parsed.driverId
      localStorage.setItem('aliado:auth', JSON.stringify(parsed))
    } catch { /* ignore */ }
  }
}

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
      console.debug('[useDriverNetwork] fetching network for driverId:', driverId)
      const result = await getDriverNetwork(driverId)
      console.debug('[useDriverNetwork] network result:', result)
      setData(result)
    } catch (err) {
      console.debug('[useDriverNetwork] fetch error:', err)
      if (err instanceof ApiError && err.status === 404) {
        clearStaleDriverId()
        setError('Perfil de motorista não encontrado. Faça logout e login novamente.')
      } else {
        setError('Não foi possível carregar sua rede agora.')
      }
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
      console.debug('[useDriverNetworkHierarchy] fetching hierarchy for driverId:', driverId)
      const result = await getDriverNetworkHierarchy(driverId)
      console.debug('[useDriverNetworkHierarchy] hierarchy result:', result)
      const sanitized: DriverNetworkHierarchy = {
        ...result,
        referrals: (result.referrals ?? []).map((node) => sanitizeNetworkTree(node)),
      }
      setData(sanitized)
    } catch (err) {
      console.debug('[useDriverNetworkHierarchy] fetch error:', err)
      if (err instanceof ApiError && err.status === 404) {
        clearStaleDriverId()
        setError('Perfil de motorista não encontrado. Faça logout e login novamente.')
      } else {
        setError('Não foi possível carregar a hierarquia da rede.')
      }
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    fetchHierarchy()
  }, [fetchHierarchy])

  return { data, loading, error, refresh: fetchHierarchy }
}
