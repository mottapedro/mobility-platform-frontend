'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createPaymentIntent, type PaymentIntentResponse } from '../../services/payments'
import { formatPrice } from '../../utils/pricing'

interface PixModalProps {
  rideId: string
  onClose: () => void
  priceBrl?: number | null
  onPaymentSuccess?: () => void
}

const PIX_TTL_SECONDS = 180

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    setRemaining(seconds)
    const t = setInterval(() => setRemaining(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(t)
  }, [seconds])
  const m = String(Math.floor(remaining / 60)).padStart(2, '0')
  const s = String(remaining % 60).padStart(2, '0')
  return { remaining, label: `${m}:${s}`, expired: remaining === 0 }
}

export function PixModal({ rideId, onClose, priceBrl, onPaymentSuccess }: PixModalProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentIntentResponse | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const mountedRef = useRef(true)
  const { remaining, label: timerLabel, expired } = useCountdown(PIX_TTL_SECONDS)

  useEffect(() => {
    mountedRef.current = true
    async function loadPaymentIntent() {
      try {
        setLoading(true)
        setError(null)
        const data = await createPaymentIntent(rideId, priceBrl != null ? { priceBrl } : undefined)
        if (!mountedRef.current) return
        setPayment(data)
      } catch (err) {
        if (!mountedRef.current) return
        setError(err instanceof Error ? err.message : 'Erro ao gerar pagamento PIX')
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }
    loadPaymentIntent()
    return () => { mountedRef.current = false }
  }, [rideId, priceBrl])

  const FALLBACK_PIX_KEY = '91e47d2f-65f6-4b36-a33a-5af9ebc1c4e6'
  const raw = (payment as Record<string, unknown>)?.qrCode
  const emvcoPayload: string =
    typeof raw === 'string' && raw.startsWith('000201') ? raw : FALLBACK_PIX_KEY

  const displayAmount = payment?.amount ?? priceBrl

  function handleCopy() {
    navigator.clipboard.writeText(emvcoPayload).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => {
      onPaymentSuccess?.()
      onClose()
    }, 1200)
  }

  /* ── Confirmed state ── */
  if (confirmed) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento confirmado"
      >
        <div className="w-full max-w-md rounded-t-2xl bg-aliado-card p-10 text-center sm:rounded-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-aliado-success/40 bg-aliado-success/10">
            <CheckCircle2 size={32} className="text-aliado-success" />
          </div>
          <p className="text-lg font-bold text-aliado-text">Pagamento confirmado!</p>
          <p className="mt-1 text-sm text-aliado-sub">
            Corrida #{rideId.slice(-8).toUpperCase()} encerrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pagar via PIX"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-aliado-card sm:rounded-2xl">

        {/* ── Drag handle ── */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-aliado-muted" />
        </div>

        {/* ── Header: Valor em destaque ── */}
        <div className="relative mx-4 mt-3 mb-3 overflow-hidden rounded-2xl border border-aliado-orange/25 bg-gradient-to-br from-[#2A1200] to-[#190A00] p-4">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-aliado-orange/10 blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full p-1 text-aliado-sub transition-colors hover:text-aliado-text"
          >
            <X size={18} />
          </button>

          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-aliado-sub">
            PAGAR VIA PIX · #{rideId.slice(-8).toUpperCase()}
          </p>

          {/* Valor principal */}
          <div className="mb-4">
            <p className="mb-1 text-xs text-aliado-sub">Total a pagar</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-aliado-sub">R$</span>
              <span className="font-bold leading-none text-aliado-text" style={{ fontSize: '2.6rem' }}>
                {displayAmount != null
                  ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(displayAmount)
                  : '—'}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl bg-aliado-input px-3 py-2.5 space-y-2">
            {payment?.breakdown && payment.breakdown.length > 0 ? (
              <>
                {payment.breakdown.map((item, i) => {
                  const isFee = /taxa|plataforma|cyborg/i.test(item.label)
                  return (
                    <div key={i} className="flex justify-between text-xs">
                      <span className={isFee ? 'font-semibold text-aliado-orange' : 'text-aliado-sub'}>
                        {item.label}
                      </span>
                      <span className={isFee ? 'font-semibold text-aliado-orange' : 'text-aliado-sub'}>
                        {formatPrice(item.amountCents / 100)}
                      </span>
                    </div>
                  )
                })}
              </>
            ) : null}
          </div>
        </div>

        {/* ── QR Code ── */}
        <div className="mx-4 mb-3 rounded-2xl border border-aliado-border bg-aliado-input py-4 flex flex-col items-center gap-3">
          {error && (
            <div className="flex w-full items-center gap-2 rounded-lg border border-aliado-error/30 bg-aliado-error/10 px-4 py-2.5 text-sm text-aliado-error mx-0">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-aliado-orange border-t-transparent" />
              <p className="text-xs text-aliado-sub">Gerando QR Code…</p>
            </div>
          ) : (
            <div
              className="rounded-xl bg-white p-2.5"
              style={{ boxShadow: expired ? 'none' : '0 0 32px rgba(242,140,40,0.15)' }}
            >
              <div className={expired ? 'opacity-30 grayscale' : ''}>
                <QRCodeSVG value={emvcoPayload} size={190} />
              </div>
            </div>
          )}

          {/* Timer */}
          {!loading && (
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums ${
              expired
                ? 'border border-aliado-error/30 bg-aliado-error/10 text-aliado-error'
                : remaining < 60
                  ? 'border border-aliado-error/30 bg-aliado-error/10 text-aliado-error'
                  : 'border border-aliado-orange/25 bg-aliado-orange/10 text-aliado-orange'
            }`}>
              <span>{expired ? '⚠' : '⏱'}</span>
              <span>{expired ? 'QR expirado — reabra o modal' : `Expira em ${timerLabel}`}</span>
            </div>
          )}
        </div>

        {/* ── Chave PIX Copia e Cola ── */}
        {!loading && emvcoPayload && (
          <div className="mx-4 mb-4 rounded-xl border border-aliado-border bg-aliado-input px-3 py-2.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-aliado-sub">
                Chave PIX · Copia e Cola
              </p>
              <p className="truncate font-mono text-xs text-aliado-muted">
                {emvcoPayload.slice(0, 34)}…
              </p>
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copiar chave PIX"
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                copied
                  ? 'border border-aliado-success/30 bg-aliado-success/10 text-aliado-success'
                  : 'bg-aliado-orange text-[#0D0700] hover:opacity-90'
              }`}
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="mx-4 mb-6 flex flex-col gap-2.5">
          <button
            onClick={handleConfirm}
            disabled={expired}
            className="w-full rounded-xl bg-aliado-success py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✓ Já paguei
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-aliado-border py-3 text-sm font-semibold text-aliado-sub transition-colors hover:border-aliado-orange/40 hover:text-aliado-orange active:scale-95"
          >
            Tive problemas para pagar
          </button>
        </div>

      </div>
    </div>
  )
}
