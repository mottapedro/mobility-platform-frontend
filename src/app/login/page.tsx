'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      // Redirect is handled by layout — but we can push based on role here
      const stored = localStorage.getItem('aliado:auth')
      if (stored) {
        const user = JSON.parse(stored)
        router.push(user.role === 'driver' ? '/driver/offers' : '/passenger/create')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Aliado</h1>
          <p className="mt-1 text-sm text-zinc-400">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Não tem conta?{' '}
          <a href="/register" className="text-orange-400 hover:underline">
            Cadastre-se
          </a>
        </p>

        {/* Demo hint */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-400">Contas demo</p>
          <p className="mt-1">Motorista: motorista@aliado.com / 123456</p>
          <p>Passageiro: passageiro@aliado.com / 123456</p>
        </div>
      </div>
    </main>
  )
}
