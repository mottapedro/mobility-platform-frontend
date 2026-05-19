'use client'

import Image from 'next/image'
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
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #2a1400 0%, #110800 40%, #0a0500 100%)' }}
    >
      <div className="flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
            style={{ background: 'radial-gradient(ellipse at center, #8b4513 0%, #3d1a00 60%, transparent 100%)' }}
          />
          <Image
            src="/logo.png"
            alt="Aliado"
            width={420}
            height={280}
            priority
            className="relative object-contain rounded-2xl"
            style={{ mixBlendMode: 'luminosity', filter: 'brightness(1.05) contrast(1.05)' }}
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 w-56">
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-xl bg-orange-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 active:scale-95"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push('/register')}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-4 text-base font-semibold text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-white active:scale-95"
          >
            Criar conta
          </button>
        </div>
      </div>
    </main>
  )
}
