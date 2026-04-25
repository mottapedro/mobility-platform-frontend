'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOffers } from '../../../hooks/useOffers'
import { respondOffer } from '../../../services/api'
import type { OfferStatus } from '../../../types'

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const map: Record<OfferStatus, { label: string; className: string }> = {
    PENDING: {
      label: 'Pendente',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    ACCEPTED: {
      label: 'Corrida aceita',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    REJECTED: {
      label: 'Rejeitada',
      className: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
    },
    EXPIRED: {
      label: 'Expirada',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  }

  const { label, className } = map[status] ?? map.EXPIRED

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}

export default function DriverOffersPage() {
  const router = useRouter()
  const [rideId, setRideId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)

  // Read rideId from localStorage (client-side only)
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
      setRespondError('Erro ao responder offer. Tente novamente.')
    } finally {
      setResponding(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
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

        {/* Ride context */}
        {ride && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Corrida ativa
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">De:</span>{' '}
              <span className="font-medium text-white">{ride.origin}</span>
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Para:</span>{' '}
              <span className="font-medium text-white">{ride.destination}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Status:{' '}
              <span className="text-orange-400 font-semibold">
                {ride.status}
              </span>
            </p>
          </div>
        )}

        {/* No rideId state */}
        {!rideId && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="mb-4 text-zinc-400">
              Nenhuma corrida ativa encontrada.
            </p>
            <button
              onClick={() => router.push('/passenger/create')}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Criar corrida
            </button>
          </div>
        )}

        {/* Loading state */}
        {rideId && loading && offers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
            <p className="text-sm">Aguardando ofertas...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {respondError && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {respondError}
          </div>
        )}

        {/* Offers list */}
        {offers.length > 0 && (
          <div className="flex flex-col gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
              >
                {/* Driver info */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
                    {offer.driver.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {offer.driver.user.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Expira: {formatDate(offer.expiresAt)}
                    </p>
                  </div>
                  <OfferStatusBadge status={offer.status} />
                </div>

                {/* Actions — only for PENDING */}
                {offer.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRespond(offer.id, true)}
                      disabled={responding === offer.id}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {responding === offer.id ? '...' : 'Aceitar'}
                    </button>
                    <button
                      onClick={() => handleRespond(offer.id, false)}
                      disabled={responding === offer.id}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-red-900/40 hover:border-red-700/50 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {responding === offer.id ? '...' : 'Rejeitar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state (rideId exists, not loading, no offers) */}
        {rideId && !loading && offers.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
            <p className="text-sm">Aguardando matching de motoristas...</p>
          </div>
        )}
      </div>
    </main>
  )
}
