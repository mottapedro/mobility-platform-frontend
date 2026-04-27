'use client'

import { useAuth } from '../contexts/AuthContext'

export function AppHeader() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {user.role === 'driver' ? 'Motorista' : 'Passageiro'}
        </span>
        <span className="text-xs text-zinc-600">·</span>
        <span className="text-sm font-medium text-white">{user.name}</span>
      </div>
      <button
        onClick={logout}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
      >
        Sair
      </button>
    </header>
  )
}
