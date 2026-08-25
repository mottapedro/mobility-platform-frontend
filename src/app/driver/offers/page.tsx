'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useOffers } from '../../../hooks/useOffers'
import { useOfferHistory } from '../../../hooks/useOfferHistory'
import { respondOffer } from '../../../services/rides'
import { useOperationalDomain } from '../../../contexts/domains/OperationalDomainProvider'
import { DriverOfferCard } from '../../../components/driver/DriverOfferCard'
import { DriverOfferHistoryCard } from '../../../components/driver/DriverOfferHistoryCard'
import { readStoredDriverId, resolveDriverId } from '../../../utils/driverId'

type OffersTab = 'active' | 'history'

export default function DriverOffersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activation } = useOperationalDomain()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<OffersTab>('active')

  useEffect(() => {
    const id = resolveDriverId(user?.driverId, readStoredDriverId())
    if (!id && process.env.NODE_ENV !== 'production') {
      console.debug({ scope: 'offers', event: 'offers_context_disabled', route: '/driver/offers' })
    }
    setDriverId(id)
  }, [user])

  const { offers, loading, error } = useOffers(driverId, {
    enabled: activation.enabled,
  })
  const history = useOfferHistory(tab === 'history')

  async function handleRespond(offerId: string, accept: boolean) {
    setResponding(offerId)
    setRespondError(null)
    try {
      await respondOffer(offerId, accept)
      // Preserve the current optimistic active-inbox behavior.
      setDismissed((prev) => new Set(prev).add(offerId))
    } catch {
      setRespondError('Erro ao responder oferta. Tente novamente.')
    } finally {
      setResponding(null)
    }
  }

  const pendingOffers = offers.filter((offer) => offer.status === 'PENDING' && !dismissed.has(offer.id))
  const activeError = error || respondError

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F5ECD8]">Ofertas</h1>
            <p className="mt-1 text-sm text-[#9A7D5A]">
              {tab === 'active' ? 'Ofertas acionáveis · atualizando a cada 8s' : 'Histórico persistente de ofertas'}
            </p>
          </div>
          {tab === 'active' && pendingOffers.length > 0 && (
            <span className="rounded-full bg-[#F28C28] px-2.5 py-0.5 text-xs font-bold text-[#0D0700]">
              {pendingOffers.length}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'active' ? 'bg-aliado-orange text-[#0D0700]' : 'border border-aliado-border bg-aliado-card text-aliado-sub'
          }`}
        >
          Ativas
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'history' ? 'bg-aliado-orange text-[#0D0700]' : 'border border-aliado-border bg-aliado-card text-aliado-sub'
          }`}
        >
          Histórico
        </button>
      </div>

      {!driverId && (
        <div className="rounded-2xl border border-aliado-border bg-aliado-card p-8 text-center">
          <p className="mb-4 text-aliado-sub">Perfil de motorista não encontrado. Faça login novamente.</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-xl bg-aliado-orange px-6 py-3 text-sm font-bold text-[#0D0700] hover:opacity-90 transition-opacity"
          >
            Ir para login
          </button>
        </div>
      )}

      {driverId && tab === 'active' && (
        <>
          {activeError && (
            <div className="mb-4 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error">
              {activeError}
            </div>
          )}
          {loading && offers.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-aliado-sub">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-aliado-muted border-t-aliado-orange" />
              <p className="text-sm">Aguardando ofertas...</p>
            </div>
          )}
          {pendingOffers.length > 0 && (
            <div className="flex flex-col gap-4">
              {pendingOffers.map((offer) => (
                <DriverOfferCard
                  key={offer.id}
                  offer={offer}
                  driverId={driverId}
                  responding={responding === offer.id}
                  onAccept={() => handleRespond(offer.id, true)}
                  onReject={() => handleRespond(offer.id, false)}
                />
              ))}
            </div>
          )}
          {pendingOffers.length === 0 && !loading && (
            <div className="rounded-2xl border border-aliado-border bg-aliado-card p-8 text-center">
              <p className="text-sm text-aliado-sub">Nenhuma oferta pendente no momento.</p>
            </div>
          )}
        </>
      )}

      {driverId && tab === 'history' && (
        <>
          {history.error && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-aliado-error/30 bg-aliado-error/10 px-4 py-3 text-sm text-aliado-error">
              <span>{history.error}</span>
              <button type="button" onClick={() => void history.refresh()} className="font-semibold underline">Tentar novamente</button>
            </div>
          )}
          {history.loading && history.items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-aliado-sub">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-aliado-muted border-t-aliado-orange" />
              <p className="text-sm">Carregando histórico...</p>
            </div>
          )}
          {!history.loading && history.items.length === 0 && !history.error && (
            <div className="rounded-2xl border border-aliado-border bg-aliado-card p-8 text-center">
              <p className="text-sm text-aliado-sub">Você ainda não possui histórico de ofertas.</p>
            </div>
          )}
          {history.items.length > 0 && (
            <div className="flex flex-col gap-4">
              {history.items.map((item) => <DriverOfferHistoryCard key={item.offerId} item={item} />)}
              {history.hasMore && (
                <button
                  type="button"
                  onClick={() => void history.loadMore()}
                  disabled={history.loadingMore}
                  className="rounded-xl border border-aliado-border bg-aliado-card py-3 text-sm font-semibold text-aliado-text disabled:opacity-50"
                >
                  {history.loadingMore ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

