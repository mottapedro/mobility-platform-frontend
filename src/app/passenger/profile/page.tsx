'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'

export default function PassengerProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  function getInitials(name: string | null | undefined): string {
    const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
    return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || 'P'
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E6D2B3]">Meu perfil</h1>
        <p className="mt-1 text-sm text-[#E6D2B3]/50">Passageiro ALIADO</p>
      </div>

      {/* Avatar + info */}
      <div className="mb-4 rounded-[1.75rem] border border-[#E6D2B3]/10 bg-[#2B1E15] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F28C28] text-xl font-bold text-[#1E140F]">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-[#E6D2B3]">{user?.name ?? '–'}</p>
            <p className="truncate text-sm text-[#E6D2B3]/50">{user?.email ?? '–'}</p>
            <span className="mt-1.5 inline-flex items-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-2.5 py-0.5 text-xs font-semibold text-[#F28C28]">
              Passageiro
            </span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="mb-4 rounded-[1.75rem] border border-[#E6D2B3]/10 bg-[#2B1E15] p-4">
        {[
          { label: 'Nome', value: user?.name ?? '–' },
          { label: 'E-mail', value: user?.email ?? '–' },
          { label: 'ID Passageiro', value: user?.passengerId ? `#${user.passengerId.slice(0, 8)}` : '–' },
        ].map(({ label, value }, i, arr) => (
          <div
            key={label}
            className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-[#E6D2B3]/8' : ''}`}
          >
            <span className="text-sm text-[#E6D2B3]/50">{label}</span>
            <span className="text-sm font-medium text-[#E6D2B3]">{value}</span>
          </div>
        ))}
      </div>

      {/* Navigation shortcuts */}
      <div className="mb-6 flex flex-col gap-2">
        {[
          { label: 'Meu motorista aliado', icon: '🤝', href: '/passenger/driver' },
          { label: 'Minhas corridas', icon: '📋', href: '/passenger/rides' },
          { label: 'Minha rede', icon: '🔗', href: '/passenger/network' },
        ].map(({ label, icon, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex items-center justify-between rounded-2xl border border-[#E6D2B3]/8 bg-[#2B1E15] px-4 py-3 transition-colors hover:border-[#E6D2B3]/15"
          >
            <div className="flex items-center gap-3">
              <span>{icon}</span>
              <span className="text-sm font-medium text-[#E6D2B3]">{label}</span>
            </div>
            <span className="text-[#E6D2B3]/30">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full rounded-2xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm font-semibold text-[#D64545] transition-colors hover:border-[#D64545]/60 hover:bg-[#D64545]/15 active:scale-[0.98]"
      >
        Sair da conta
      </button>
    </div>
  )
}
