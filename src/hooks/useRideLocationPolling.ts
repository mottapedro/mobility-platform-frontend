import { useEffect, useRef, useState } from 'react'
import { getRideLocation } from '../services/rides'
import { isLocationStale } from '../utils/staleness'
import type { RideLocation, RideStatus } from '../types'

const POLL_INTERVAL_MS = 4000
const TERMINAL_STATUSES: RideStatus[] = ['COMPLETED', 'CANCELLED']

export function useRideLocationPolling(rideId: string, status: RideStatus) {
  const [location, setLocation] = useState<RideLocation | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTerminal = TERMINAL_STATUSES.includes(status)

  useEffect(() => {
    if (isTerminal) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    async function fetchLocation() {
      try {
        const data = await getRideLocation(rideId)
        setLocation(data)
        setIsStale(isLocationStale(data.receivedAt))
        setError(null)
      } catch {
        setError('Erro ao buscar localização do motorista.')
      }
    }

    function start() {
      if (intervalId) return
      fetchLocation()
      intervalId = setInterval(fetchLocation, POLL_INTERVAL_MS)
    }

    function stop() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop()
      } else {
        start()
      }
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [rideId, isTerminal])

  const staleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!location || isTerminal) return
    staleCheckRef.current = setInterval(() => {
      setIsStale(isLocationStale(location.receivedAt))
    }, 1000)
    return () => {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current)
    }
  }, [location, isTerminal])

  return { location, isStale, error }
}
