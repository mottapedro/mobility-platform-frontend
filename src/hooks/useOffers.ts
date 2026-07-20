'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDriverOffers } from '../services/drivers'
import { ApiError } from '../services/api'
import type { DriverOffer } from '../types'
import { sanitizeDriverId } from '../utils/driverId'

interface UseOffersResult {
  offers: DriverOffer[]
  loading: boolean
  error: string | null
  refresh: () => Promise<boolean>
}

const OFFERS_POLL_MS = 8000

export function useOffers(
  driverId: string | null,
  options?: { enabled?: boolean },
): UseOffersResult {
  const [offers, setOffers] = useState<DriverOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const safeDriverId = sanitizeDriverId(driverId)
  const enabled = options?.enabled ?? true

  const debug = useCallback((event: string, extra?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') return
    console.debug({
      scope: 'offers',
      event,
      ...extra,
    })
  }, [])

  const fetchOffers = useCallback(async () => {
    if (!enabled) {
      debug('offers_fetch_skipped', { reason: 'domain_disabled' })
      setLoading(false)
      return false
    }
    if (!safeDriverId) {
      debug('offers_fetch_skipped', { reason: 'missing_or_invalid_driver_id' })
      setLoading(false)
      return false
    }
    try {
      const data = await getDriverOffers(safeDriverId)
      debug('offers_fetch_succeeded', { count: data.length })
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
        debug('offers_fetch_failed', {
          reason: 'api_error',
          message: err instanceof Error ? err.message : 'unknown_error',
        })
        setError('Erro ao carregar ofertas. Verifique se o backend está rodando.')
      }
      return false // failure
    } finally {
      setLoading(false)
    }
  }, [debug, enabled, safeDriverId])

  useEffect(() => {
    if (!enabled) {
      debug('offers_context_disabled', { reason: 'domain_disabled' })
      setOffers([])
      setError(null)
      setLoading(false)
      return
    }

    if (!safeDriverId) {
      debug('offers_context_disabled', { reason: 'missing_or_invalid_driver_id' })
      return
    }

    setLoading(true)
    // Only start polling after a successful first fetch
    fetchOffers().then((ok) => {
      if (!ok) return
      intervalRef.current = setInterval(fetchOffers, OFFERS_POLL_MS)
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [debug, enabled, fetchOffers, safeDriverId])

  return { offers, loading, error, refresh: fetchOffers }
}
