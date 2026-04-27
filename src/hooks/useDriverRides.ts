'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDriverRides } from '../services/drivers'
import type { DriverRide } from '../types'

interface UseDriverRidesResult {
  rides: DriverRide[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDriverRides(driverId: string | null): UseDriverRidesResult {
  const [rides, setRides] = useState<DriverRide[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRides = useCallback(async () => {
    if (!driverId) return
    try {
      const data = await getDriverRides(driverId)
      setRides(data)
      setError(null)
    } catch {
      setError('Erro ao carregar corridas. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    if (!driverId) return

    setLoading(true)
    fetchRides()

    intervalRef.current = setInterval(fetchRides, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [driverId, fetchRides])

  return { rides, loading, error, refresh: fetchRides }
}
