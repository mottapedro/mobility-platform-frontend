'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createPaymentIntent, type PaymentIntentResponse } from '../../services/payments'
import { formatPrice } from '../../utils/pricing'

interface PixModalProps {
  rideId: string
  onClose: () => void
  priceBrl?: number | null
  onPaymentSuccess?: () => void
}

export function PixModal({ rideId, onClose, priceBrl, onPaymentSuccess }: PixModalProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentIntentResponse | null>(null)
  const mountedRef = useRef(true)

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
        const message = err instanceof Error ? err.message : 'Erro ao gerar pagamento PIX'
        setError(message)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    loadPaymentIntent()
    return () => { mountedRef.current = false }
  }, [rideId, priceBrl])

  const FALLBACK_PIX_KEY = '91e47d2f-65f6-4b36-a33a-5af9ebc1c4e6'

  // Use the full EMVCo payload from the backend (contains Tag 54 with the ride amount).
  // Falls back to the bare PIX key if the backend hasn't responded or returned a valid payload.
  const raw = (payment as Record<string, unknown>)?.qrCode
  const emvcoPayload: string =
    typeof raw === 'string' && raw.startsWith('000201') ? raw : FALLBACK_PIX_KEY

  function handleCopy() {
    navigator.clipboard.writeText(emvcoPayload).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const displayAmount = payment?.amount ?? priceBrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pagar via PIX"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-[#1A0E04] p-6 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#F5ECD8]">Pagar via PIX</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-[#9A7D5A] transition-colors hover:text-[#F5ECD8]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ride ID */}
        <p className="mb-5 text-sm text-[#9A7D5A]">
          Corrida #{rideId.slice(-8).toUpperCase()}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-[#F28C28]/20 bg-[#0D0700] py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F28C28] border-t-transparent" />
            <p className="text-xs text-[#9A7D5A]">Gerando QR Code...</p>
          </div>
        ) : emvcoPayload ? (
          <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-[#F28C28]/20 bg-[#0D0700] p-4">
            <div className="rounded-lg bg-white p-2">
              <QRCodeSVG value={emvcoPayload} size={200} />
            </div>
          </div>
        ) : (
          <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-[#F28C28]/20 bg-[#0D0700] py-8">
            <p className="text-xs text-[#9A7D5A]">QR code não disponível</p>
          </div>
        )}

        {/* PIX key - only EMVCo copia-cola payload for clipboard */}
        {emvcoPayload && (
          <div className="mb-4 rounded-xl border border-[#F28C28]/20 bg-[#0D0700] p-4">
            <p className="mb-1 text-xs text-[#9A7D5A]">Chave PIX (Copia e Cola)</p>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-mono text-sm text-[#F5ECD8]">
                {emvcoPayload.slice(0, 32)}...
              </span>
              <button
                onClick={handleCopy}
                aria-label="Copiar chave PIX"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F28C28] px-3 py-1.5 text-xs font-semibold text-[#0D0700] transition-opacity hover:opacity-90 active:scale-95"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Breakdown (Fatura Aberta) */}
        {payment?.breakdown && payment.breakdown.length > 0 && (
          <div className="mb-3 space-y-1.5 border-t border-[#F28C28]/10 pt-3">
            {payment.breakdown.map((item, index) => {
              const isPlatformFee = /taxa|plataforma/i.test(item.label)
              return (
                <div
                  key={index}
                  className="flex justify-between text-xs"
                >
                  <span className={isPlatformFee ? 'font-semibold text-[#F28C28]' : 'text-[#9A7D5A]'}>
                    {item.label}
                  </span>
                  <span className={isPlatformFee ? 'font-semibold text-[#F28C28]' : 'text-[#9A7D5A]'}>
                    {formatPrice(item.value)}
                  </span>
                </div>
              )
            })}
            {/* Divider before total */}
            <div className="my-1.5 border-t border-[#F28C28]/5" />
          </div>
        )}

        {/* Beneficiary + amount */}
        <div className="mb-6 flex justify-between text-sm">
          <span className="text-[#9A7D5A]">Aliado Mobilidade</span>
          <span className="font-semibold text-[#3DB87A]">
            {displayAmount != null ? formatPrice(displayAmount) : '—'}
          </span>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => {
            onPaymentSuccess?.()
            onClose()
          }}
          className="w-full rounded-xl bg-[#3DB87A] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
        >
          Confirmar pagamento
        </button>
      </div>
    </div>
  )
}