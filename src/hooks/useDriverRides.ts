'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDriverRides } from '../services/drivers'
import type { DriverRide } from '../types'
import { sanitizeDriverId } from '../utils/driverId'

interface UseDriverRidesResult {
  rides: DriverRide[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDriverRides(
  driverId: string | null,
  options?: { enabled?: boolean },
): UseDriverRidesResult {
  const [rides, setRides] = useState<DriverRide[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const safeDriverId = sanitizeDriverId(driverId)
  const enabled = options?.enabled ?? true

  const fetchRides = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    if (!safeDriverId) {
      setLoading(false)
      return
    }
    try {
      const data = await getDriverRides(safeDriverId)
      setRides(data)
      setError(null)
    } catch {
      setError('Erro ao carregar corridas. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }, [enabled, safeDriverId])

  useEffect(() => {
    if (!enabled) {
      setRides([])
      setError(null)
      setLoading(false)
      return
    }

    if (!safeDriverId) return

    setLoading(true)
    fetchRides()

    intervalRef.current = setInterval(fetchRides, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, fetchRides, safeDriverId])

  return { rides, loading, error, refresh: fetchRides }
}
