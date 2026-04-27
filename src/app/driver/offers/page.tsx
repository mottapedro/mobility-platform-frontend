'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useOffers } from '../../../hooks/useOffers'
import { respondOffer } from '../../../services/rides'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import type { DriverOffer } from '../../../types'

export default function DriverOffersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)

  useEffect(() => {
    const id =
      user?.driverId ??
      localStorage.getItem('driverId') ??
      null
    console.log('[DriverOffersPage] driverId resolved:', id, '| user:', user)
    setDriverId(id)
  }, [user])

  const { offers, loading, error } = useOffers(driverId)

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

  const now = new Date()
  const pendingOffers = offers.filter(
    (o) => o.status === 'PENDING' && new Date(o.expiresAt) > now,
  )

  return (
    <ProtectedRoute requiredRole="driver">
      <AppHeader />
      <main className="min-h-screen bg-[#0a0a0a] px-4 pt-24 pb-10">
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
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>

          {(error || respondError) && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error ?? respondError}
            </div>
          )}

          {!driverId && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="mb-4 text-zinc-400">
                Perfil de motorista não encontrado. Faça login novamente.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Ir para login
              </button>
            </div>
          )}

          {driverId && loading && offers.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
              <p className="text-sm">Aguardando ofertas...</p>
            </div>
          )}

          {pendingOffers.length > 0 && (
            <div className="flex flex-col gap-4">
              {pendingOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  responding={responding === offer.id}
                  onAccept={() => handleRespond(offer.id, true)}
                  onReject={() => handleRespond(offer.id, false)}
                />
              ))}
            </div>
          )}

          {driverId && pendingOffers.length === 0 && !loading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-400">Nenhuma oferta pendente no momento.</p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}

interface OfferCardProps {
  offer: DriverOffer
  responding: boolean
  onAccept: () => void
  onReject: () => void
}

function OfferCard({ offer, responding, onAccept, onReject }: OfferCardProps) {
  const ride = offer.rideRequest
  const minutesLeft = Math.max(
    0,
    Math.floor((new Date(offer.expiresAt).getTime() - Date.now()) / 60000),
  )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-4">
      {/* Ride info */}
      <div className="flex flex-col gap-1.5">
        {ride?.passenger?.user?.name && (
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Passageiro:{' '}
            <span className="text-zinc-300 normal-case">{ride.passenger.user.name}</span>
          </p>
        )}
        {ride?.origin && (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="text-zinc-400">
              <span className="text-orange-400 font-semibold">De:</span> {ride.origin}
            </span>
            <span className="text-zinc-400">
              <span className="text-orange-400 font-semibold">Para:</span> {ride.destination}
            </span>
          </div>
        )}
        {ride?.scheduledAt && (
          <p className="text-xs text-zinc-500">
            {new Date(ride.scheduledAt).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}
        <p className="text-xs text-zinc-600">Expira em {minutesLeft} min</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          disabled={responding}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-red-700/50 hover:bg-red-900/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {responding ? '...' : 'Rejeitar'}
        </button>
      </div>
    </div>
  )
}
