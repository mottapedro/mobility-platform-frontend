'use client'

import type { Offer } from '../../types'
import { RideContextBadges } from './RideContextBadges'
import { Countdown } from './Countdown'

interface DriverOfferCardProps {
  offer: Offer & { rideContext?: import('../../types').RideContext | null }
  passengerName?: string
  origin?: string
  destination?: string
  distanceKm?: number | null
  durationMin?: number | null
  onAccept: () => void
  onReject: () => void
  responding: boolean
}

export function DriverOfferCard({
  offer,
  passengerName,
  origin,
  destination,
  distanceKm,
  durationMin,
  onAccept,
  onReject,
  responding,
}: DriverOfferCardProps) {
  const isVip = offer.rideContext?.isVip
  const isAssisted = offer.rideContext?.isAssistedTransport

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        isVip
          ? 'border-orange-500/40 bg-orange-500/5'
          : isAssisted
          ? 'border-violet-500/30 bg-violet-500/5'
          : 'border-[#2E1A08] bg-[#1A0E04]'
      }`}
    >
      {/* Driver info */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
          {offer.driver.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-white">
            {offer.driver.user.name}
          </p>
          {offer.driver.user.phone && (
            <p className="text-xs text-zinc-500">{offer.driver.user.phone}</p>
          )}
        </div>
        {isVip && (
          <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
            ⭐ VIP
          </span>
        )}
        {isAssisted && !isVip && (
          <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-400">
            ♿ Assistido
          </span>
        )}
      </div>

      {/* Ride details */}
      {(origin || destination) && (
        <div className="mb-3 space-y-1 rounded-lg bg-zinc-800/50 px-3 py-2.5">
          {passengerName && (
            <p className="text-xs text-zinc-500">
              Passageiro:{' '}
              <span className="font-medium text-zinc-300">{passengerName}</span>
            </p>
          )}
          {origin && (
            <p className="text-xs text-zinc-500">
              De: <span className="font-medium text-zinc-300">{origin}</span>
            </p>
          )}
          {destination && (
            <p className="text-xs text-zinc-500">
              Para:{' '}
              <span className="font-medium text-zinc-300">{destination}</span>
            </p>
          )}
          {(distanceKm != null || durationMin != null) && (
            <p className="mt-1 text-xs text-[#F5ECD8]/70">
              🚗 {distanceKm ?? '--'} km • ⏱ {durationMin ?? '--'} min
            </p>
          )}
        </div>
      )}

      {/* Context badges */}
      <RideContextBadges context={offer.rideContext} />

      {/* Timer */}
      <div className="mt-3 mb-4">
        {offer.status === 'PENDING' ? (
          <Countdown expiresAt={offer.expiresAt} />
        ) : (
          <StatusLabel status={offer.status} />
        )}
      </div>

      {/* Actions — only for PENDING */}
      {offer.status === 'PENDING' && (
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            disabled={responding}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {responding ? '...' : 'Aceitar'}
          </button>
          <button
            onClick={onReject}
            disabled={responding}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-red-700/50 hover:bg-red-900/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {responding ? '...' : 'Rejeitar'}
          </button>
        </div>
      )}
    </div>
  )
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACCEPTED: {
      label: '✓ Corrida aceita',
      className: 'text-green-400',
    },
    REJECTED: {
      label: 'Rejeitada',
      className: 'text-zinc-500',
    },
    EXPIRED: {
      label: 'Expirada',
      className: 'text-red-400',
    },
  }

  const { label, className } = map[status] ?? { label: status, className: 'text-zinc-400' }

  return <span className={`text-xs font-semibold ${className}`}>{label}</span>
}
