'use client'

import type { OfferBookItem, OfferBookStatus } from '../../types'
import { formatPrice } from '../../utils/pricing'

const STATUS_PRESENTATION: Record<OfferBookStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Oferta ativa', className: 'border-aliado-orange/30 bg-aliado-orange/10 text-aliado-orange' },
  ACCEPTED: { label: 'Aceita', className: 'border-aliado-success/30 bg-aliado-success/10 text-aliado-success' },
  REJECTED: { label: 'Recusada', className: 'border-aliado-error/30 bg-aliado-error/10 text-aliado-error' },
  EXPIRED: { label: 'Expirada', className: 'border-aliado-muted/40 bg-aliado-muted/10 text-aliado-sub' },
  LOST: { label: 'Encerrada', className: 'border-aliado-muted/40 bg-aliado-muted/10 text-aliado-sub' },
  UNAVAILABLE: { label: 'Indisponível', className: 'border-aliado-muted/40 bg-aliado-muted/10 text-aliado-sub' },
}
const OUTCOME_PRESENTATION: Record<OfferBookItem['outcomeReason'], string> = {
  ACTIVE_OFFER: 'Aguardando resposta.',
  DRIVER_ACCEPTED: 'Você aceitou esta oferta.',
  DRIVER_REJECTED: 'Você recusou esta oferta.',
  OFFER_EXPIRED: 'O prazo para resposta terminou.',
  ANOTHER_DRIVER_ACCEPTED: 'Outro motorista confirmou esta corrida.',
  RIDE_UNAVAILABLE: 'A corrida não está mais disponível.',
}

function formatDate(value: string | null): string {
  if (!value) return 'Data não informada'
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function DriverOfferHistoryCard({ item }: { item: OfferBookItem }) {
  const presentation = STATUS_PRESENTATION[item.bookStatus]

  return (
    <article
      data-testid={`offer-history-card-${item.offerId}`}
      className="rounded-2xl border border-aliado-border bg-aliado-card p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-aliado-text">Oferta de corrida</p>
          <p className="mt-1 text-xs text-aliado-sub">Recebida em {formatDate(item.createdAt)}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${presentation.className}`}>
          {presentation.label}
        </span>
      </div>

      <div className="rounded-xl border border-aliado-border bg-[#0D0700]/50 px-4 py-3 text-sm">
        <p className="text-aliado-text/80">
          <span className="font-semibold text-aliado-orange">De:</span> {item.origin}
        </p>
        <p className="mt-1.5 text-aliado-text/80">
          <span className="font-semibold text-aliado-orange">Para:</span> {item.destination}
        </p>
        <p className="mt-2 text-xs text-aliado-sub">Corrida agendada: {formatDate(item.scheduledAt)}</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-aliado-sub">Seu valor</p>
          <p className="mt-0.5 text-lg font-bold text-aliado-success">
            {item.driverReceivableAmountCents === null
              ? '—'
              : formatPrice(item.driverReceivableAmountCents / 100)}
          </p>
        </div>
        <p className="text-right text-xs text-aliado-sub">
          {OUTCOME_PRESENTATION[item.outcomeReason]}
        </p>
      </div>
    </article>
  )
}
