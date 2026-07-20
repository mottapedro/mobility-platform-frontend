'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useDriverRides } from '../../../hooks/useDriverRides'
import { completeRideLifecycle, startRideLifecycle } from '../../../services/rides'
import { formatPrice } from '../../../utils/pricing'
import type { DriverRide, RideContext } from '../../../types'
import { readStoredDriverId, resolveDriverId } from '../../../utils/driverId'

// Statuses the driver still needs to act on. Everything else (COMPLETED,
// CANCELLED, REJECTED, EXPIRED, ...) is history — kept out of the default
// view so old rides don't pile up on the screen the driver operates from.
const ACTIVE_STATUSES = ['ACCEPTED', 'STARTED', 'IN_PROGRESS']

export default function DriverRidesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)

  useEffect(() => {
    const id = resolveDriverId(user?.driverId, readStoredDriverId())
    setDriverId(id)
  }, [user])

  const { rides, loading, error } = useDriverRides(driverId)
  const [updatingRide, setUpdatingRide] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const visibleRides = rides.filter((ride) =>
    tab === 'active' ? ACTIVE_STATUSES.includes(ride.status) : !ACTIVE_STATUSES.includes(ride.status),
  )

  async function handleStartRide(rideId: string) {
    setUpdatingRide(rideId)
    setUpdateError(null)
    try {
      // PATCH /rides/:id is RPC-style (action: reject_referral/reschedule
      // only) — state transitions go through the lifecycle endpoints.
      // ACCEPTED → IN_PROGRESS directly, no intermediate STARTED state.
      await startRideLifecycle(rideId)
      router.push(`/trips/${rideId}`)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Erro ao iniciar corrida.')
    } finally {
      setUpdatingRide(null)
    }
  }

  async function handleFinishRide(rideId: string) {
    setUpdatingRide(rideId)
    setUpdateError(null)
    try {
      await completeRideLifecycle(rideId)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Erro ao finalizar corrida.')
    } finally {
      setUpdatingRide(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-aliado-text">Corridas</h1>
        <p className="mt-1 text-sm text-aliado-sub">Painel do motorista · atualizando a cada 8s</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab('active')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'active'
              ? 'bg-aliado-orange text-[#0D0700]'
              : 'border border-aliado-border bg-aliado-card text-aliado-sub'
          }`}
        >
          Ativas
        </button>
        <button
          onClick={() => setTab('history')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'history'
              ? 'bg-aliado-orange text-[#0D0700]'
              : 'border border-aliado-border bg-aliado-card text-aliado-sub'
          }`}
        >
          Histórico
        </button>
      </div>

      {updateError && (
        <div className="mb-4 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error flex items-center justify-between gap-3">
          <span>{updateError}</span>
          <button
            onClick={() => setUpdateError(null)}
            className="shrink-0 text-aliado-error/60 hover:text-aliado-error"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error">
          {error}
        </div>
      )}

      {!driverId && (
        <div className="rounded-2xl border border-aliado-border bg-aliado-card p-8 text-center">
          <p className="text-sm text-aliado-sub">
            Motorista não identificado. Faça login novamente.
          </p>
        </div>
      )}

      {driverId && loading && rides.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-aliado-sub">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-aliado-muted border-t-aliado-orange" />
          <p className="text-sm">Carregando corridas...</p>
        </div>
      )}

      {driverId && !loading && visibleRides.length === 0 && (
        <div className="rounded-2xl border border-aliado-border bg-aliado-card p-8 text-center">
          <p className="text-sm text-aliado-sub">
            {tab === 'active' ? 'Nenhuma corrida ativa no momento.' : 'Nenhuma corrida no histórico ainda.'}
          </p>
        </div>
      )}

      {visibleRides.length > 0 && (
        <div className="flex flex-col gap-4">
          {visibleRides.map((ride) => (
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

function rideStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ACCEPTED':
      return {
        label: '✓ Confirmada',
        className: 'border-aliado-success/30 bg-aliado-success/10 text-aliado-success',
      }
    case 'STARTED':
      return {
        label: '🚗 A caminho',
        className: 'border-aliado-orange/30 bg-aliado-orange/10 text-aliado-orange',
      }
    case 'IN_PROGRESS':
      return {
        label: '🚗 Em andamento',
        className: 'border-aliado-orange/30 bg-aliado-orange/10 text-aliado-orange',
      }
    case 'COMPLETED':
      return {
        label: '✓ Finalizada',
        className: 'border-aliado-success/30 bg-aliado-success/10 text-aliado-success',
      }
    case 'CANCELLED':
      return {
        label: '✕ Cancelada',
        className: 'border-aliado-error/30 bg-aliado-error/10 text-aliado-error',
      }
    default:
      return {
        label: status,
        className: 'border-aliado-border bg-aliado-card text-aliado-sub',
      }
  }
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
  const badge = rideStatusBadge(ride.status)
  const scheduledDate = new Date(ride.scheduledAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-2xl border border-aliado-border bg-aliado-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aliado-orange text-sm font-bold text-[#0D0700]">
            {passenger.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-aliado-sub">
              Passageiro
            </p>
            <p className="font-semibold text-aliado-text">{passenger.name}</p>
            {passenger.phone && (
              <p className="text-xs text-aliado-sub">{passenger.phone}</p>
            )}
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-aliado-border bg-aliado-input px-4 py-3 text-sm">
        <p>
          <span className="font-semibold text-aliado-orange">De:</span>{' '}
          <span className="text-aliado-text">{ride.origin}</span>
        </p>
        <p>
          <span className="font-semibold text-aliado-orange">Para:</span>{' '}
          <span className="text-aliado-text">{ride.destination}</span>
        </p>
        <p>
          <span className="font-semibold text-aliado-orange">Horário:</span>{' '}
          <span className="text-aliado-text">{scheduledDate}</span>
        </p>
      </div>

      {(ride.distanceKm != null || ride.durationMin != null) && (
        <div className="flex items-center justify-between rounded-xl border border-aliado-border bg-aliado-input px-4 py-2.5 text-sm">
          <span className="text-aliado-sub">
            🚗 {ride.distanceKm ?? '--'} km • ⏱ {ride.durationMin ?? '--'} min
          </span>
          {ride.priceBrl != null && (
            <span className="font-bold text-aliado-success">
              {formatPrice(ride.priceBrl)}
            </span>
          )}
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

      {/* A caminho: ACCEPTED → STARTED */}
      {ride.status === 'ACCEPTED' && (
        <button
          onClick={onStartRide}
          disabled={updating}
          className="w-full rounded-xl bg-aliado-orange py-2.5 text-sm font-bold text-[#0D0700] transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
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

      {/* Finalizar: STARTED ou IN_PROGRESS → COMPLETED */}
      {(ride.status === 'STARTED' || ride.status === 'IN_PROGRESS') && (
        <button
          onClick={onFinishRide}
          disabled={updating}
          className="w-full rounded-xl bg-aliado-success py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
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
    <span className="rounded-full border border-aliado-orange/30 bg-aliado-orange/10 px-2.5 py-1 text-xs font-semibold text-aliado-orange">
      {children}
    </span>
  )
}
