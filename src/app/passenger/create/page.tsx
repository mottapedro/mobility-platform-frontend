'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRide } from '../../../services/api'
import { usePassenger } from '../../../hooks/usePassenger'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { useAuth } from '../../../contexts/AuthContext'
import type { RideContext } from '../../../types'

interface ContextCheckboxProps {
  label: string
  emoji: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ContextCheckbox({ label, emoji, checked, onChange }: ContextCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
        checked
          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {checked && <span className="ml-auto text-orange-500">✓</span>}
    </button>
  )
}

export default function PassengerCreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const passengerId = user!.id

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [isVip, setIsVip] = useState(false)
  const [isAirport, setIsAirport] = useState(false)
  const [isPet, setIsPet] = useState(false)
  const [isLuggage, setIsLuggage] = useState(false)

  const { data, loading, error } = usePassenger(passengerId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!origin.trim() || !destination.trim() || !scheduledAt) {
      setSubmitError('Preencha todos os campos obrigatórios.')
      return
    }

    if (new Date(scheduledAt) <= new Date()) {
      setSubmitError('A data deve ser futura.')
      return
    }

    const hasContext = isVip || isAirport || isPet || isLuggage
    const context: RideContext | undefined = hasContext
      ? { isVip, isAirport, isPet, isLuggage }
      : undefined

    setSubmitting(true)
    try {
      const { ride } = await createRide({
        passengerId,
        origin: origin.trim(),
        destination: destination.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        ...(context ? { context } : {}),
      })
      const stored = localStorage.getItem('passengerRideIds')
      const ids: string[] = stored ? JSON.parse(stored) : []
      ids.unshift(ride.id)
      localStorage.setItem('passengerRideIds', JSON.stringify(ids))
      router.push('/passenger/rides')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Erro ao criar corrida. Verifique se o backend esta rodando.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="passenger">
      <main className="min-h-screen bg-[#0a0500] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Criar corrida</h1>
          <p className="mt-1 text-sm text-zinc-400">Passageiro</p>
        </div>

        <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
            Motorista aliado indicado
          </p>

          {loading && (
            <p className="text-sm text-zinc-400">Carregando motorista aliado...</p>
          )}

          {error && (
            <p className="text-sm text-red-400">Erro ao carregar motorista</p>
          )}

          {data?.referredByDriver && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {data.referredByDriver.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {data.referredByDriver.user.name}
                </p>
                {data.referredByDriver.user.phone && (
                  <p className="text-xs text-zinc-400">
                    {data.referredByDriver.user.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && !error && !data?.referredByDriver && (
            <p className="text-sm text-zinc-400">
              Nenhum motorista aliado vinculado.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">Origem</label>
            <input
              type="text"
              placeholder="Ex: Barra da Tijuca, Rio de Janeiro"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">Destino</label>
            <input
              type="text"
              placeholder="Ex: Aeroporto Galeão, Rio de Janeiro"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">
              Hor&#225;rio da corrida
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Informações adicionais
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ContextCheckbox emoji="⭐" label="VIP" checked={isVip} onChange={setIsVip} />
              <ContextCheckbox emoji="✈️" label="Aeroporto" checked={isAirport} onChange={setIsAirport} />
              <ContextCheckbox emoji="🐶" label="Pet" checked={isPet} onChange={setIsPet} />
              <ContextCheckbox emoji="🧳" label="Bagagem" checked={isLuggage} onChange={setIsLuggage} />
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-orange-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {submitting ? 'Criando corrida...' : 'Criar corrida'}
          </button>
        </form>
      </div>
    </main>
  </ProtectedRoute>
  )
}