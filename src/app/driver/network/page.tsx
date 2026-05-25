'use client'

// ─── ALIADO Nacional V2 — Driver network page ──────────────────────────────
// Pure render layer over the backend-governed NetworkContext.
// Frontend MUST NOT infer flowType / genealogy / ownership: everything comes
// from `useNetworkContext`. Composition is delegated to <NetworkExperience />.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useNetworkContext } from '../../../hooks/useNetworkContext'
import { NetworkExperience } from '../../../components/network/v2/NetworkExperience'
import { DriverReferralCard } from '../../../components/driver/DriverReferralCard'

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04] ${className}`} />
}

export default function DriverNetworkPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)

  useEffect(() => {
    const id =
      user?.driverId ??
      (typeof window !== 'undefined' ? localStorage.getItem('driverId') : null) ??
      null
    setDriverId(id)
  }, [user])

  const { context, loading, error, refresh } = useNetworkContext({
    actorId: driverId,
    actorType: 'driver',
  })

  return (
    <div className="mx-auto max-w-lg">
      {/* Referral share card — operational complement, not part of NetworkContext. */}
      <div className="mb-6">
        <DriverReferralCard />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F5ECD8]">Minha Rede</h1>
          <p className="mt-1 text-sm text-[#9A7D5A]">Genealogia e operação</p>
        </div>
        {context && !loading && (
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-[#2E1A08] px-3 py-1.5 text-xs font-semibold text-[#9A7D5A] transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
          >
            Atualizar
          </button>
        )}
      </div>

      {/* No driver id */}
      {!driverId && (
        <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
          <p className="mb-4 text-[#9A7D5A]">
            Perfil de motorista não encontrado. Faça login novamente.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#0D0700] transition-opacity hover:opacity-90"
          >
            Ir para login
          </button>
        </div>
      )}

      {/* Error */}
      {driverId && error && (
        <div
          data-testid="network-error"
          className="mb-4 flex items-center justify-between rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={refresh}
            className="ml-4 rounded-lg border border-[#E05050]/30 px-2 py-0.5 text-xs font-semibold text-[#E05050] hover:bg-[#E05050]/10"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading */}
      {driverId && loading && !context && (
        <div className="flex flex-col gap-4" data-testid="network-loading">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-10 w-2/3" />
          <SkeletonBlock className="h-40" />
        </div>
      )}

      {/* Loaded */}
      {driverId && context && (
        <NetworkExperience context={context} />
      )}

      {/* Empty (loaded but no genealogy) */}
      {driverId && !loading && !error && !context && (
        <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
          <p className="mb-2 text-3xl">🤝</p>
          <p className="mb-1 font-semibold text-[#F5ECD8]">Sua rede está vazia</p>
          <p className="text-sm text-[#9A7D5A]">
            Compartilhe seu link de indicação para começar a construir sua rede.
          </p>
        </div>
      )}
    </div>
  )
}
