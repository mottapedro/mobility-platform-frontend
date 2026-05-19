'use client'

import { useState } from 'react'
import { X, Copy, CheckCircle2, QrCode } from 'lucide-react'

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY ?? 'aliado@pagamentos.com.br'
const PIX_BENEFICIARY = process.env.NEXT_PUBLIC_PIX_BENEFICIARY ?? 'Aliado Mobilidade'
const PIX_AMOUNT = process.env.NEXT_PUBLIC_PIX_AMOUNT ?? 'R$ 5,00'

interface PixModalProps {
  rideId: string
  onClose: () => void
}

export function PixModal({ rideId, onClose }: PixModalProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pagar via PIX"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-[#2B1E15] p-6 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#E6D2B3]">Pagar via PIX</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-[#E6D2B3]/50 transition-colors hover:text-[#E6D2B3]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ride ID */}
        <p className="mb-5 text-sm text-[#E6D2B3]/50">
          Corrida #{rideId.slice(-8).toUpperCase()}
        </p>

        {/* QR code placeholder */}
        <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-[#F28C28]/20 bg-[#1E140F] py-8">
          <QrCode size={80} className="text-[#F28C28]" />
          <p className="text-xs text-[#E6D2B3]/40">QR code disponível em breve</p>
        </div>

        {/* PIX key */}
        <div className="mb-4 rounded-xl border border-[#F28C28]/20 bg-[#1E140F] p-4">
          <p className="mb-1 text-xs text-[#E6D2B3]/50">Chave PIX</p>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-sm text-[#E6D2B3]">{PIX_KEY}</span>
            <button
              onClick={handleCopy}
              aria-label="Copiar chave PIX"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F28C28] px-3 py-1.5 text-xs font-semibold text-[#1E140F] transition-opacity hover:opacity-90 active:scale-95"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Beneficiary + amount */}
        <div className="mb-6 flex justify-between text-sm text-[#E6D2B3]/60">
          <span>{PIX_BENEFICIARY}</span>
          <span className="font-semibold text-[#3FAE5A]">{PIX_AMOUNT}</span>
        </div>

        {/* Confirm button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-[#3FAE5A] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
        >
          Confirmar pagamento
        </button>
      </div>
    </div>
  )
}
