'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #2a1400 0%, #110800 40%, #0a0500 100%)' }}
    >
      <div className="flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
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

        {/* CTA */}
        <button
          onClick={() => router.push('/driver/offers')}
          className="w-56 rounded-xl bg-orange-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 active:scale-95"
        >
          Acessar
        </button>

        {/* Quick links */}
        <div className="flex gap-6 text-sm text-zinc-500">
          <button
            onClick={() => router.push('/passenger/create')}
            className="underline underline-offset-4 hover:text-orange-400 transition-colors"
          >
            Criar corrida (passageiro)
          </button>
          <span>·</span>
          <button
            onClick={() => router.push('/driver/offers')}
            className="underline underline-offset-4 hover:text-orange-400 transition-colors"
          >
            Ver ofertas (motorista)
          </button>
        </div>
      </div>
    </main>
  )
}
