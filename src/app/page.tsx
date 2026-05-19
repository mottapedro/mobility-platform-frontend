'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function WelcomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (user.role === 'driver') {
      router.replace('/driver/offers')
    } else {
      router.replace('/passenger')
    }
  }, [loading, user, router])

  // Prevent flicker: show spinner while auth resolves OR while redirecting
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0500]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    )
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between px-6 py-12"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, #2a1400 0%, #110800 40%, #0a0500 100%)' }}
    >
      {/* Top: logo + tagline */}
      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/10">
          <svg viewBox="0 0 48 24" fill="none" className="w-10 h-6" stroke="#F28C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16 L8 9 L16 7 L32 7 L40 9 L43 16" />
            <path d="M3 16 L45 16" />
            <rect x="5" y="16" width="38" height="5" rx="2.5" />
            <circle cx="13" cy="21" r="3" fill="#F28C28" stroke="#F28C28" />
            <circle cx="35" cy="21" r="3" fill="#F28C28" stroke="#F28C28" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-[0.35em] text-[#F5ECD8]">ALIADO</h1>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.32em] uppercase text-[#F28C28]/70">
            SEU ALIADO EM CADA VIAGEM
          </p>
        </div>
      </div>

      {/* Middle: pitch */}
      <div className="flex flex-col items-center gap-6 max-w-xs text-center">
        <h2 className="text-2xl font-bold leading-snug text-[#F5ECD8]">
          Aliado{' '}
          <span className="text-[#F28C28]">do seu lado</span>
          {'\n'}em cada viagem
        </h2>
        <p className="text-sm leading-6 text-[#F5ECD8]/55">
          Conectamos passageiros e motoristas de confiança para viagens melhores todos os dias.
        </p>
        <ul className="w-full flex flex-col gap-2 text-left">
          {[
            'Motorista pessoal',
            'Atendimento humanizado',
            'Viagens com preferência',
            'Rede de indicações',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-[#F5ECD8]/75">
              <span className="text-[#F28C28] text-base">✦</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-xs pb-4">
        <button
          onClick={() => router.push('/register')}
          className="w-full rounded-2xl bg-[#F28C28] px-8 py-4 text-base font-bold text-[#0D0700] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Criar conta
        </button>
        <button
          onClick={() => router.push('/login')}
          className="w-full rounded-2xl border border-[#2E1A08] bg-transparent px-8 py-4 text-base font-semibold text-[#F5ECD8] transition-all hover:border-[#5A3F22] active:scale-[0.98]"
        >
          Entrar
        </button>
      </div>
    </main>
  )
}
