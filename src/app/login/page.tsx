'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Card, SectionTitle } from '../../design-system'
import PasswordInput from '../../components/PasswordInput'

export default function LoginPage() {
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
      // redirect is handled inside AuthContext.login()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo-aliado.jpeg" alt="Logo Aliado" className="h-28 w-auto mb-2" />
          <SectionTitle className="text-center text-3xl mb-0">Aliado</SectionTitle>
        </div>
        <p className="text-center text-sm text-gray-200 mb-4">Entre na sua conta</p>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Senha</label>
              <PasswordInput
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="mt-1"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-gray-400">
          Não tem conta?{' '}
          <a href="/register" className="text-orange-400 hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </main>
  )
}
