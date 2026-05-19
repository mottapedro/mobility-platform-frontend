'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { DriverReferralCard } from '../../../components/driver/DriverReferralCard'

export default function DriverProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F28C28] text-2xl font-bold text-[#1E140F]">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#E6D2B3]">{user?.name ?? '—'}</p>
          <p className="text-sm text-[#E6D2B3]/50">{user?.email ?? '—'}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-[#F28C28]/15 px-2.5 py-0.5 text-xs font-semibold text-[#F28C28]">
            Motorista
          </span>
        </div>
      </div>

      {/* Referral card */}
      <div className="mb-6">
        <DriverReferralCard />
      </div>

      {/* Info rows */}
      <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4">
        <Row label="Nome" value={user?.name ?? '—'} />
        <Row label="E-mail" value={user?.email ?? '—'} />
        {user?.driverId && <Row label="ID do Motorista" value={`#${user.driverId.slice(-8).toUpperCase()}`} />}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-[#D64545]/30 py-3.5 text-sm font-semibold text-[#D64545] transition-colors hover:border-[#D64545]/60 hover:bg-[#D64545]/5"
      >
        Sair da conta
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#E6D2B3]/50">{label}</span>
      <span className="text-sm font-medium text-[#E6D2B3]">{value}</span>
    </div>
  )
}
