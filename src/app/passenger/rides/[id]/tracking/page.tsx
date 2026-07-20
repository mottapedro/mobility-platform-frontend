'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getRide } from '../../../../../services/rides'
import { useRideLocationPolling } from '../../../../../hooks/useRideLocationPolling'
import { RideTrackingMap } from '../../../../../components/passenger/RideTrackingMap'
import type { Ride } from '../../../../../types'

export default function RideTrackingPage() {
  const params = useParams<{ id: string }>()
  const rideId = params.id
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getRide(rideId)
      .then((r) => {
        if (!cancelled) setRide(r)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [rideId])

  const { location, isStale, error } = useRideLocationPolling(rideId, ride?.status ?? 'PENDING')

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5ECD8]">Acompanhar corrida</h1>
        <p className="mt-1 text-sm text-[#9A7D5A]">
          {ride ? `${ride.origin} → ${ride.destination}` : 'Carregando corrida...'}
        </p>
      </div>

      {loading && <div className="h-72 w-full animate-pulse rounded-2xl bg-[#1A0E04]" />}

      {!loading && (ride?.status === 'COMPLETED' || ride?.status === 'CANCELLED') && (
        <p className="rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-3 text-sm text-[#9A7D5A]">
          Esta corrida já foi encerrada.
        </p>
      )}

      {!loading && ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
        <RideTrackingMap location={location} isStale={isStale} />
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]">
          {error}
        </p>
      )}
    </div>
  )
}
