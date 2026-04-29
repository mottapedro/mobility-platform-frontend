'use client'

import { useAuth } from '../contexts/AuthContext'

export function AppHeader() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#F28C28]/20 bg-[#1E140F]/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#F28C28]/70">
          {user.role === 'driver' ? 'Motorista' : 'Passageiro'}
        </span>
        <span className="text-xs text-[#E6D2B3]/30">·</span>
        <span className="text-sm font-medium text-[#E6D2B3]">{user.name}</span>
      </div>
      <button
        onClick={logout}
        className="rounded-lg border border-[#E6D2B3]/15 px-3 py-1.5 text-xs font-semibold text-[#E6D2B3]/50 transition-colors hover:border-[#D64545]/50 hover:text-[#D64545]"
      >
        Sair
      </button>
    </header>
  )
}
