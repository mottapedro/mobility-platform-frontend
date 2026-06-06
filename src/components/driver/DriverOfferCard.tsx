'use client'

import type { DriverOffer, RideContext, RegionalContext } from '../../types'
import { calculatePrice, formatPrice } from '../../utils/pricing'
import { Countdown } from './Countdown'

interface DriverOfferCardProps {
  offer: DriverOffer
  driverId: string
  responding: boolean
  onAccept: () => void
  onReject: () => void
}

export function DriverOfferCard({
  offer,
  driverId,
  responding,
  onAccept,
  onReject,
}: DriverOfferCardProps) {
  const ride = offer.rideRequest
  const passenger = ride.passenger
  const isReferral = passenger.referredByDriverId === driverId
  const context = ride.context as RideContext | null
  const regionalContext = ride.regionalContext as RegionalContext | null

  const contextBadges: { label: string; emoji: string }[] = []
  if (context?.isVip) contextBadges.push({ label: 'VIP', emoji: '⭐' })
  if (context?.isAirport) contextBadges.push({ label: 'Aeroporto', emoji: '✈️' })
  if (context?.isPet) contextBadges.push({ label: 'Pet', emoji: '🐶' })
  if (context?.isLuggage) contextBadges.push({ label: 'Bagagem', emoji: '🧳' })

  const price =
    ride.priceBrl != null
      ? ride.priceBrl
      : ride.distanceKm != null && ride.durationMin != null
      ? calculatePrice(ride.distanceKm, ride.durationMin)
      : null

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
        isReferral
          ? 'border-[#F28C28]/60 bg-[#1A0E04] shadow-[0_0_24px_0_rgba(242,140,40,0.10)]'
          : 'border-[#2E1A08] bg-[#1A0E04]'
      }`}
    >
      {/* Priority badge row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isReferral
                ? 'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/40'
                : 'bg-[#2E1A08] text-[#9A7D5A] border border-[#2E1A08]'
            }`}
          >
            {isReferral ? '★ Seu cliente' : '◎ Disponível na rede'}
          </span>
          {regionalContext?.isRegionalPriority && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              📍 Prioridade regional
            </span>
          )}
        </div>
        <Countdown expiresAt={offer.expiresAt} />
      </div>

      {/* Passenger */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isReferral ? 'bg-[#F28C28] text-[#0D0700]' : 'bg-[#2E1A08] text-[#F5ECD8]'
          }`}
        >
          {passenger.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-[#F5ECD8]">{passenger.user.name}</p>
          {passenger.user.phone && (
            <p className="text-xs text-[#9A7D5A]">{passenger.user.phone}</p>
          )}
        </div>
      </div>

      {/* Route + pricing */}
      <div className="rounded-xl border border-[#2E1A08] bg-[#0D0700]/60 px-4 py-3 flex flex-col gap-1.5 text-sm">
        <p className="text-[#F5ECD8]/70">
          <span className="font-semibold text-[#F28C28]">De:</span> {ride.origin}
        </p>
        <p className="text-[#F5ECD8]/70">
          <span className="font-semibold text-[#F28C28]">Para:</span> {ride.destination}
        </p>
        <p className="text-xs text-[#F5ECD8]/70 mt-1">
          🚗 {ride.distanceKm ?? '--'} km • ⏱ {ride.durationMin ?? '--'} min
        </p>
        {price != null && (
          <p className="text-sm font-bold text-[#3DB87A] mt-1">
            💰 {formatPrice(price)}
          </p>
        )}
        <p className="text-xs text-[#9A7D5A]">
          {new Date(ride.scheduledAt).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
        {regionalContext?.region && (
          <p className="text-xs text-emerald-400/80 mt-0.5">
            📍 Região: {regionalContext.region}
            {regionalContext.cluster && (
              <span className="text-emerald-400/40"> · {regionalContext.cluster}</span>
            )}
          </p>
        )}
      </div>

      {/* Context badges */}
      {contextBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contextBadges.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1 rounded-full border border-[#F28C28]/25 bg-[#F28C28]/8 px-2.5 py-0.5 text-xs font-medium text-[#F28C28]"
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          disabled={responding}
          className="flex-1 rounded-xl bg-[#3DB87A] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {responding ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Aguarde...
            </span>
          ) : (
            'Aceitar'
          )}
        </button>
        <button
          onClick={onReject}
          disabled={responding}
          className="flex-1 rounded-xl border border-[#2E1A08] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#9A7D5A] transition-colors hover:border-[#E05050]/50 hover:text-[#E05050] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {responding ? '...' : 'Rejeitar'}
        </button>
      </div>
    </div>
  )
}
