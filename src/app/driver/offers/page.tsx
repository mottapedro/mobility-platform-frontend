'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOffers } from '../../../hooks/useOffers'
import { respondOffer } from '../../../services/api'
import { DriverOfferCard } from '../../../components/driver/DriverOfferCard'
import { RideMap } from '../../../components/driver/RideMap'
import type { Offer, RideContext } from '../../../types'

function sortOffers(offers: (Offer & { rideContext?: RideContext | null })[]) {
  return [...offers].sort((a, b) => {
    const score = (o: typeof a) =>
      (o.rideContext?.isVip ? 4 : 0) +
      (o.rideContext?.isAirport ? 2 : 0) +
      (o.rideContext?.isPet ? 1 : 0)
    return score(b) - score(a)
  })
}

export default function DriverOffersPage() {
  const router = useRouter()
  const [rideId, setRideId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('currentRideId')
    setRideId(stored)
  }, [])

  const { ride, offers, loading, error } = useOffers(rideId)

  async function handleRespond(offerId: string, accept: boolean) {
    setResponding(offerId)
    setRespondError(null)
    try {
      await respondOffer(offerId, accept)
    } catch {
      setRespondError('Erro ao responder oferta. Tente novamente.')
    } finally {
      setResponding(null)
    }
  }

  const enrichedOffers = sortOffers(
    offers.map((o) => ({ ...o, rideContext: ride?.context ?? null }))
  )

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
          >
            ← Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Ofertas</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Painel do motorista · atualizando a cada 2s
              </p>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {ride && (
          <div className="mb-6 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Corrida ativa
                </p>
                {ride.passenger?.user?.name && (
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {ride.passenger.user.name}
                  </p>
                )}
              </div>
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
                {ride.status}
              </span>
            </div>
            <RideMap origin={ride.origin} destination={ride.destination} />
          </div>
        )}

        {!rideId && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="mb-4 text-zinc-400">Nenhuma corrida ativa encontrada.</p>
            <button
              onClick={() => router.push('/passenger/create')}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Criar corrida
            </button>
          </div>
        )}

        {rideId && loading && offers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
            <p className="text-sm">Aguardando ofertas...</p>
          </div>
        )}

        {(error || respondError) && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error ?? respondError}
          </div>
        )}

        {enrichedOffers.length > 0 && (
          <div className="flex flex-col gap-4">
            {enrichedOffers.map((offer) => (
              <DriverOfferCard
                key={offer.id}
                offer={offer}
                passengerName={ride?.passenger?.user?.name}
                origin={ride?.origin}
                destination={ride?.destination}
                onAccept={() => handleRespond(offer.id, true)}
                onReject={() => handleRespond(offer.id, false)}
                responding={responding === offer.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
