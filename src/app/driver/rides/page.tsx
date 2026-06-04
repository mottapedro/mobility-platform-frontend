'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useDriverRides } from '../../../hooks/useDriverRides'
import { updateRide } from '../../../services/rides'
import { calculatePrice, formatPrice } from '../../../utils/pricing'
import type { DriverRide, RideContext } from '../../../types'
import { readStoredDriverId, resolveDriverId } from '../../../utils/driverId'

export default function DriverRidesPage() {
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)

  useEffect(() => {
    const id = resolveDriverId(user?.driverId, readStoredDriverId())
    setDriverId(id)
  }, [user])

  const { rides, loading, error } = useDriverRides(driverId)
  const [updatingRide, setUpdatingRide] = useState<string | null>(null)

  async function handleStartRide(rideId: string) {
    setUpdatingRide(rideId)
    try {
      await updateRide(rideId, { status: 'IN_PROGRESS' })
    } catch {
      // ignore — hook will refresh
    } finally {
      setUpdatingRide(null)
    }
  }

  async function handleFinishRide(rideId: string) {
    setUpdatingRide(rideId)
    try {
      await updateRide(rideId, { status: 'COMPLETED' })
    } catch {
      // ignore — hook will refresh
    } finally {
      setUpdatingRide(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F5ECD8]">Agenda</h1>
        <p className="mt-1 text-sm text-[#9A7D5A]">Corridas confirmadas</p>
      </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]">
              {error}
            </div>
          )}

          {!driverId && (
            <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
              <p className="text-sm text-[#9A7D5A]">
                Motorista não identificado. Faça login novamente.
              </p>
            </div>
          )}

          {driverId && loading && rides.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-[#9A7D5A]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5A3F22] border-t-[#F28C28]" />
              <p className="text-sm">Carregando agenda...</p>
            </div>
          )}

          {driverId && !loading && rides.length === 0 && (
            <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
              <p className="text-sm text-[#9A7D5A]">Nenhuma corrida confirmada.</p>
            </div>
          )}

          {rides.length > 0 && (
            <div className="flex flex-col gap-4">
          {rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  updating={updatingRide === ride.id}
                  onStartRide={() => handleStartRide(ride.id)}
                  onFinishRide={() => handleFinishRide(ride.id)}
                />
              ))}
            </div>
          )}
    </div>
  )
}

function RideCard({
  ride,
  updating,
  onStartRide,
  onFinishRide,
}: {
  ride: DriverRide
  updating: boolean
  onStartRide: () => void
  onFinishRide: () => void
}) {
  const passenger = ride.passenger.user
  const context = ride.context as RideContext | null
  const scheduledDate = new Date(ride.scheduledAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F28C28] text-sm font-bold text-[#0D0700]">
            {passenger.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7D5A]">
              Passageiro
            </p>
            <p className="font-semibold text-[#F5ECD8]">{passenger.name}</p>
            {passenger.phone && (
              <p className="text-xs text-[#9A7D5A]">{passenger.phone}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#3DB87A]/30 bg-[#3DB87A]/10 px-3 py-1 text-xs font-semibold text-[#3DB87A]">
          {ride.status === 'COMPLETED' ? '✓ Finalizada' : ride.status === 'IN_PROGRESS' ? '🚗 A caminho' : '✓ Confirmada'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-[#2E1A08] bg-[#0D0700]/60 px-4 py-3 text-sm">
        <p className="text-[#F5ECD8]/70">
          <span className="font-semibold text-[#F28C28]">De:</span>{' '}
          <span className="text-[#F5ECD8]">{ride.origin}</span>
        </p>
        <p className="text-[#F5ECD8]/70">
          <span className="font-semibold text-[#F28C28]">Para:</span>{' '}
          <span className="text-[#F5ECD8]">{ride.destination}</span>
        </p>
        <p className="text-[#F5ECD8]/70">
          <span className="font-semibold text-[#F28C28]">Horário:</span>{' '}
          <span className="text-[#F5ECD8]">{scheduledDate}</span>
        </p>
      </div>

      {ride.distanceKm != null && ride.durationMin != null && (
        <div className="flex items-center justify-between rounded-xl border border-[#2E1A08] bg-[#0D0700]/60 px-4 py-2.5 text-sm">
          <span className="text-[#9A7D5A]">🚗 {ride.distanceKm} km • ⏱ {ride.durationMin} min</span>
          <span className="font-bold text-[#3DB87A]">
            {formatPrice(calculatePrice(ride.distanceKm, ride.durationMin))}
          </span>
        </div>
      )}

      {context && (context.isVip || context.isAirport || context.isPet || context.isLuggage) && (
        <div className="flex flex-wrap gap-2">
          {context.isVip     && <Badge>⭐ VIP</Badge>}
          {context.isAirport && <Badge>✈️ Aeroporto</Badge>}
          {context.isPet     && <Badge>🐶 Pet</Badge>}
          {context.isLuggage && <Badge>💼 Bagagem</Badge>}
        </div>
      )}

      {ride.status === 'ACCEPTED' && (
        <button
          onClick={onStartRide}
          disabled={updating}
          className="w-full rounded-xl bg-[#F28C28] py-2.5 text-sm font-bold text-[#0D0700] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {updating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0D0700]/30 border-t-[#0D0700]" />
              Atualizando...
            </span>
          ) : (
            '🚗 A caminho'
          )}
        </button>
      )}

      {ride.status === 'IN_PROGRESS' && (
        <button
          onClick={onFinishRide}
          disabled={updating}
          className="w-full rounded-xl bg-[#3DB87A] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {updating ? (
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-2.5 py-1 text-xs font-semibold text-[#F28C28]">
      {children}
    </span>
  )
}
