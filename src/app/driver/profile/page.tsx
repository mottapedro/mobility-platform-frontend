'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { DriverReferralCard } from '../../../components/driver/DriverReferralCard'
import { useNetworkContext } from '../../../hooks/useNetworkContext'
import { readStoredDriverId, resolveDriverId } from '../../../utils/driverId'
import { resolveInviteUrl } from '../../../utils/inviteUrls'

export default function DriverProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [hasAssistedTransport, setHasAssistedTransport] = useState(false)
  const [driverId, setDriverId] = useState<string | null>(() => readStoredDriverId())

  const { context } = useNetworkContext({
    actorId: driverId,
    actorType: 'driver',
    enabled: !!driverId,
  })

  useEffect(() => {
    setHasAssistedTransport(localStorage.getItem('aliado:assistedTransport') === 'true')
  }, [])

  useEffect(() => {
    const id = resolveDriverId(user?.driverId, readStoredDriverId())
    setDriverId(id)
  }, [user])

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : 'DR'

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Avatar + name */}
      <div className="mb-8 flex flex-col items-center gap-3 pt-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F28C28] text-2xl font-bold text-[#0D0700]">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#F5ECD8]">{user?.name ?? '—'}</p>
          <p className="text-sm text-[#9A7D5A]">{user?.email ?? '—'}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-[#F28C28]/15 px-2.5 py-0.5 text-xs font-semibold text-[#F28C28]">
            Motorista
          </span>
        </div>
      </div>

      {/* Referral card */}
      <div className="mb-6">
        <DriverReferralCard
          d2pUrl={resolveInviteUrl(context?.inviteUrls, 'd2p')}
          d2dUrl={resolveInviteUrl(context?.inviteUrls, 'd2d')}
          capabilities={context?.capabilities}
        />
      </div>

      {/* Especialidades */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7D5A]">Especialidades</p>
        {hasAssistedTransport ? (
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-3">
            <span className="text-xl">♿</span>
            <div>
              <p className="text-sm font-semibold text-violet-300">Transporte Assistido</p>
              <p className="text-xs text-[#9A7D5A]">Mobilidade reduzida, cadeirante e acompanhamento</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5A3F22]">
            Nenhuma especialidade declarada. Você pode atualizar no cadastro.
          </p>
        )}
      </div>

      {/* Info rows */}
      <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4">
        <Row label="Nome" value={user?.name ?? '—'} />
        <Row label="E-mail" value={user?.email ?? '—'} />
        {user?.driverId && <Row label="ID do Motorista" value={`#${user.driverId.slice(-8).toUpperCase()}`} />}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-[#E05050]/30 py-3.5 text-sm font-semibold text-[#E05050] transition-colors hover:border-[#E05050]/60 hover:bg-[#E05050]/5"
      >
        Sair da conta
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#9A7D5A]">{label}</span>
      <span className="text-sm font-medium text-[#F5ECD8]">{value}</span>
    </div>
  )
}
