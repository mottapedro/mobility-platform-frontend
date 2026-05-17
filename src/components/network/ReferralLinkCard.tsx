'use client'

import { Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'

interface ReferralLinkCardProps {
  eyebrow: string
  title: string
  description: string
  displayUrl: string
  fullUrl: string
  whatsappText: string
  avatarLabel?: string
  disabled?: boolean
}

export function ReferralLinkCard({
  eyebrow,
  title,
  description,
  displayUrl,
  fullUrl,
  whatsappText,
  avatarLabel = 'AL',
  disabled = false,
}: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (disabled || !fullUrl) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied.
    }
  }

  function handleWhatsApp() {
    if (disabled || !fullUrl) return
    const text = encodeURIComponent(whatsappText)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="rounded-[1.75rem] border border-[#F28C28]/20 bg-[linear-gradient(180deg,rgba(242,140,40,0.12),rgba(43,30,21,0.96))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#E6D2B3]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#E6D2B3]/55">{description}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 text-sm font-bold text-[#FAD2A4]">
          {avatarLabel}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E6D2B3]/10 bg-[#1E140F]/60 px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate font-mono text-sm text-[#E6D2B3]/80">{displayUrl}</p>
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          title="Copiar link"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6D2B3]/10 bg-[#E6D2B3]/5 text-[#E6D2B3]/60 transition-all hover:border-[#F28C28]/40 hover:text-[#F28C28] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#1E140F] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={16} />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#3FAE5A]/40 bg-[#3FAE5A]/10 px-4 py-3 text-sm font-bold text-[#3FAE5A] transition-all hover:bg-[#3FAE5A]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
      </div>
    </section>
  )
}
