'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeRideLifecycle, getRide } from '../../../services/rides'
import { startGpsTracker, type GpsTrackerHandle } from '../../../lib/gps/GpsTracker'
import { sanitizeDriverId } from '../../../utils/driverId'
import type { Ride } from '../../../types'

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED']

async function resolveDriverId(rideId: string): Promise<string | null> {
  const stored = sanitizeDriverId(sessionStorage.getItem('driverId'))
  if (stored) return stored

  try {
    const ride = await getRide(rideId)
    const fetched = sanitizeDriverId(ride.selectedDriverId)
    if (fetched) sessionStorage.setItem('driverId', fetched)
    return fetched
  } catch {
    return null
  }
}

export function TripTrackingClient({ rideId }: { rideId: string }) {
  const router = useRouter()
  const trackerRef = useRef<GpsTrackerHandle | null>(null)

  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [driverId, rideData] = await Promise.all([resolveDriverId(rideId), getRide(rideId)])
      if (cancelled) return

      setRide(rideData)
      setLoading(false)

      if (!driverId) {
        setGpsError('Motorista não identificado. Faça login novamente para transmitir sua localização.')
        return
      }
      if (TERMINAL_STATUSES.includes(rideData.status)) return

      trackerRef.current = startGpsTracker(rideId, driverId, {
        onError: (message) => setGpsError(message),
      })
      setTracking(true)
    }

    init()

    return () => {
      cancelled = true
      trackerRef.current?.stop()
      trackerRef.current = null
    }
  }, [rideId])

  async function handleFinish() {
    setFinishing(true)
    setFinishError(null)
    try {
      await completeRideLifecycle(rideId)
      // Stop transmitting immediately — don't wait for unmount/navigation.
      trackerRef.current?.stop()
      trackerRef.current = null
      setTracking(false)
      router.push('/driver/rides')
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : 'Erro ao finalizar corrida.')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-between px-4 py-8">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-aliado-text">Modo Viagem</h1>
            <p className="mt-1 text-sm text-aliado-sub">Corrida em andamento</p>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              tracking
                ? 'border-aliado-success/30 bg-aliado-success/10 text-aliado-success'
                : 'border-aliado-error/30 bg-aliado-error/10 text-aliado-error'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tracking ? 'bg-aliado-success animate-pulse' : 'bg-aliado-error'}`} />
            {tracking ? 'Transmitindo GPS' : 'GPS parado'}
          </span>
        </div>

        {gpsError && (
          <div className="mb-4 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error">
            {gpsError}
          </div>
        )}

        {finishError && (
          <div className="mb-4 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error">
            {finishError}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-aliado-sub">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-aliado-muted border-t-aliado-orange" />
            <p className="text-sm">Carregando viagem...</p>
          </div>
        )}

        {!loading && ride && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-aliado-border bg-aliado-input px-4 py-3 text-sm">
            <p>
              <span className="font-semibold text-aliado-orange">Passageiro:</span>{' '}
              <span className="text-aliado-text">{ride.passenger.user.name}</span>
            </p>
            <p>
              <span className="font-semibold text-aliado-orange">De:</span>{' '}
              <span className="text-aliado-text">{ride.origin}</span>
            </p>
            <p>
              <span className="font-semibold text-aliado-orange">Para:</span>{' '}
              <span className="text-aliado-text">{ride.destination}</span>
            </p>
          </div>
        )}

        {!loading && ride && TERMINAL_STATUSES.includes(ride.status) && (
          <p className="mt-4 rounded-xl border border-aliado-border bg-aliado-card px-4 py-3 text-sm text-aliado-sub">
            Esta corrida já foi encerrada.
          </p>
        )}
      </div>

      {!loading && ride && !TERMINAL_STATUSES.includes(ride.status) && (
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="w-full rounded-xl bg-aliado-success py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {finishing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Finalizando...
            </span>
          ) : (
            '🏁 Finalizar corrida'
          )}
        </button>
      )}
    </div>
  )
}
