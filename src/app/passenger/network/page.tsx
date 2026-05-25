'use client'

// ─── ALIADO Nacional V2 — Passenger network page ───────────────────────────
// Pure render layer over the backend-governed NetworkContext.
// Frontend MUST NOT infer flowType / rootDriver / genealogy: everything comes
// from `useNetworkContext`. Composition delegated to <NetworkExperience />.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useNetworkContext } from '../../../hooks/useNetworkContext'
import { NetworkExperience } from '../../../components/network/v2/NetworkExperience'
import { PassengerReferralCard } from '../../../components/passenger/PassengerReferralCard'

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04] ${className}`} />
}

export default function PassengerNetworkPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [passengerId, setPassengerId] = useState<string | null>(null)

  useEffect(() => {
    const id =
      user?.passengerId ??
      (typeof window !== 'undefined' ? localStorage.getItem('passengerId') : null) ??
      null
    setPassengerId(id)
  }, [user])

  const { context, loading, error, refresh } = useNetworkContext({
    actorId: passengerId,
    actorType: 'passenger',
  })

  // Referral code from auth payload (BE-issued). NetworkContext currently
  // does not expose referral codes on actor records.
  const referralCode = user?.referralCode ?? null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <PassengerReferralCard
          passengerId={passengerId}
          passengerName={user?.name}
          referralCode={referralCode}
        />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F5ECD8]">Minha Rede</h1>
          <p className="mt-1 text-sm text-[#9A7D5A]">Genealogia, ownership operacional e laterais</p>
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

      {/* No passenger id */}
      {!passengerId && (
        <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
          <p className="mb-4 text-[#9A7D5A]">
            Perfil de passageiro não encontrado. Faça login novamente.
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
      {passengerId && error && (
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
      {passengerId && loading && !context && (
        <div className="flex flex-col gap-4" data-testid="network-loading">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-10 w-2/3" />
          <SkeletonBlock className="h-40" />
        </div>
      )}

      {/* Loaded */}
      {passengerId && context && (
        <NetworkExperience context={context} />
      )}

      {/* Empty */}
      {passengerId && !loading && !error && !context && (
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
