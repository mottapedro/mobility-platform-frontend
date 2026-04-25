'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getRide } from '../services/api'
import type { Offer, Ride } from '../types'

interface UseOffersResult {
  ride: Ride | null
  offers: Offer[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useOffers(rideId: string | null): UseOffersResult {
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRide = useCallback(async () => {
    if (!rideId) return
    try {
      const data = await getRide(rideId)
      setRide(data)
      setError(null)
    } catch {
      setError('Erro ao carregar offers. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }, [rideId])

  useEffect(() => {
    if (!rideId) return

    setLoading(true)
    fetchRide()

    intervalRef.current = setInterval(() => {
      fetchRide()
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [rideId, fetchRide])

  return {
    ride,
    offers: ride?.offers ?? [],
    loading,
    error,
    refresh: fetchRide,
  }
}
