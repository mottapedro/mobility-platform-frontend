'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useOffers } from '../../../hooks/useOffers'
import { respondOffer } from '../../../services/rides'
import { Countdown } from '../../../components/driver/Countdown'
import { useOperationalDomain } from '../../../contexts/domains/OperationalDomainProvider'
import type { DriverOffer, RideContext, RegionalContext } from '../../../types'
import { readStoredDriverId, resolveDriverId } from '../../../utils/driverId'

export default function DriverOffersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activation } = useOperationalDomain()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const id = resolveDriverId(user?.driverId, readStoredDriverId())
    if (!id && process.env.NODE_ENV !== 'production') {
      console.debug({
        scope: 'offers',
        event: 'offers_context_disabled',
        route: '/driver/offers',
      })
    }
    setDriverId(id)
  }, [user])

  const { offers, loading, error } = useOffers(driverId, {
    enabled: activation.enabled,
  })

  async function handleRespond(offerId: string, accept: boolean) {
    setResponding(offerId)
    setRespondError(null)
    try {
      await respondOffer(offerId, accept)
      // Optimistic: remove card immediately after response
      setDismissed((prev) => new Set(prev).add(offerId))
    } catch {
      setRespondError('Erro ao responder oferta. Tente novamente.')
    } finally {
      setResponding(null)
    }
  }

  const now = new Date()
  const pendingOffers = offers.filter(
    (o) =>
      o.status === 'PENDING' &&
      new Date(o.expiresAt) > now &&
      !dismissed.has(o.id),
  )

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F5ECD8]">Ofertas</h1>
            <p className="mt-1 text-sm text-[#9A7D5A]">
              Painel do motorista · atualizando a cada 2s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingOffers.length > 0 && (
              <span className="rounded-full bg-[#F28C28] px-2.5 py-0.5 text-xs font-bold text-[#0D0700]">
                {pendingOffers.length}
              </span>
            )}
            <div className="h-2 w-2 rounded-full bg-[#3DB87A] animate-pulse" />
          </div>
        </div>
      </div>

          {/* Error */}
          {(error || respondError) && (
            <div className="mb-4 rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]">
              {error ?? respondError}
            </div>
          )}

          {/* No driver */}
          {!driverId && (
            <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
              <p className="mb-4 text-[#9A7D5A]">
                Perfil de motorista não encontrado. Faça login novamente.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#0D0700] hover:opacity-90 transition-opacity"
              >
                Ir para login
              </button>
            </div>
          )}

          {/* Loading */}
          {driverId && loading && offers.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-[#9A7D5A]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5A3F22] border-t-[#F28C28]" />
              <p className="text-sm">Aguardando ofertas...</p>
            </div>
          )}

          {/* Offer list */}
          {pendingOffers.length > 0 && (
            <div className="flex flex-col gap-4">
              {pendingOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  driverId={driverId!}
                  responding={responding === offer.id}
                  onAccept={() => handleRespond(offer.id, true)}
                  onReject={() => handleRespond(offer.id, false)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {driverId && pendingOffers.length === 0 && !loading && (
            <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
              <p className="text-sm text-[#9A7D5A]">Nenhuma oferta pendente no momento.</p>
            </div>
          )}
    </div>
  )
}

interface OfferCardProps {
  offer: DriverOffer
  driverId: string
  responding: boolean
  onAccept: () => void
  onReject: () => void
}

function OfferCard({ offer, driverId, responding, onAccept, onReject }: OfferCardProps) {
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
            isReferral ? 'bg-[#F28C28] text-[#0D0700]' : 'bg-[#1A0E04] text-[#F5ECD8]'
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

      {/* Route */}
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
