'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { buildDriverSlug } from '../../services/drivers'

export function DriverReferralCard() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user?.name) return null

  const slug = buildDriverSlug(user.name)
  const origin = mounted ? window.location.origin : ''
  const url = `${origin}/r/${slug}`
  const displayUrl = `/r/${slug}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard permission denied — fail silently
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Agende sua corrida comigo pelo app Aliado 🚗\n${url}`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-[1.75rem] border border-[#F28C28]/20 bg-[linear-gradient(180deg,rgba(242,140,40,0.10),rgba(43,30,21,0.96))] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
      {/* Label */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F28C28]/70">
        Seu link de indicação
      </p>

      {/* URL display */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#E6D2B3]/10 bg-[#1E140F]/60 px-3 py-2.5">
        {mounted ? (
          <p className="min-w-0 flex-1 truncate font-mono text-sm text-[#E6D2B3]/80">
            {displayUrl}
          </p>
        ) : (
          <div className="h-4 flex-1 animate-pulse rounded bg-[#E6D2B3]/10" />
        )}
        <button
          onClick={handleCopy}
          title="Copiar link"
          className="shrink-0 rounded-lg border border-[#E6D2B3]/10 bg-[#E6D2B3]/5 px-2.5 py-1 text-xs font-semibold text-[#E6D2B3]/60 transition-all hover:border-[#F28C28]/40 hover:text-[#F28C28] active:scale-95"
        >
          {copied ? '✓ Copiado' : '📋'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 rounded-2xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#1E140F] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {copied ? '✓ Copiado!' : 'Copiar Link'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 rounded-2xl border border-[#3FAE5A]/40 bg-[#3FAE5A]/10 px-4 py-2.5 text-sm font-bold text-[#3FAE5A] transition-all hover:bg-[#3FAE5A]/15 active:scale-[0.98]"
        >
          WhatsApp
        </button>
      </div>
    </div>
  )
}
