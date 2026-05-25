'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDriverOffers } from '../services/drivers'
import { ApiError } from '../services/api'
import type { DriverOffer } from '../types'

interface UseOffersResult {
  offers: DriverOffer[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useOffers(driverId: string | null): UseOffersResult {
  const [offers, setOffers] = useState<DriverOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOffers = useCallback(async () => {
    if (!driverId) return
    try {
      const data = await getDriverOffers(driverId)
      console.log('[useOffers] driverId:', driverId)
      console.log('[useOffers] response:', data)
      data.forEach((o) =>
        console.log(`  offer ${o.id} | status: ${o.status} | expiresAt: ${o.expiresAt}`),
      )
      setOffers(data)
      setError(null)
      return true // success
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Stale driverId — clear it so re-login gets a fresh one
        if (typeof window !== 'undefined') {
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
        setError('Perfil de motorista não encontrado. Faça logout e login novamente.')
      } else {
        console.error('[useOffers] fetch error:', err)
        setError('Erro ao carregar ofertas. Verifique se o backend está rodando.')
      }
      return false // failure
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    if (!driverId) return

    setLoading(true)
    // Only start polling after a successful first fetch
    fetchOffers().then((ok) => {
      if (!ok) return
      intervalRef.current = setInterval(fetchOffers, 2000)
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [driverId, fetchOffers])

  return { offers, loading, error, refresh: fetchOffers }
}
