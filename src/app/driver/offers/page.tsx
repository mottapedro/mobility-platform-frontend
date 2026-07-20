'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useOffers } from '../../../hooks/useOffers'
import { respondOffer } from '../../../services/rides'
import { useOperationalDomain } from '../../../contexts/domains/OperationalDomainProvider'
import { DriverOfferCard } from '../../../components/driver/DriverOfferCard'
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

  const pendingOffers = offers.filter(
    (o) =>
      o.status === 'PENDING' &&
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
              Painel do motorista · atualizando a cada 8s
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
                <DriverOfferCard
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

