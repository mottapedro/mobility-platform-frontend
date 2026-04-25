'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRide } from '../../../services/api'
import { usePassenger } from '../../../hooks/usePassenger'

const FALLBACK_PASSENGER_ID = 'b3a5278a-0ebf-4d97-8699-669951c8e41c'

export default function PassengerCreatePage() {
  const router = useRouter()

  const [passengerId, setPassengerId] = useState<string>('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Resolve passengerId from localStorage (fallback to hardcoded UUID for MVP)
  useEffect(() => {
    const stored = localStorage.getItem('passengerId')
    if (stored) {
      setPassengerId(stored)
    } else {
      localStorage.setItem('passengerId', FALLBACK_PASSENGER_ID)
      setPassengerId(FALLBACK_PASSENGER_ID)
    }
  }, [])

  const { data, loading, error } = usePassenger(passengerId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!origin.trim() || !destination.trim() || !scheduledAt) {
      setSubmitError('Preencha todos os campos.')
      return
    }

    setSubmitting(true)
    try {
      const { ride } = await createRide({
        passengerId,
        origin: origin.trim(),
        destination: destination.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      localStorage.setItem('currentRideId', ride.id)
      router.push('/driver/offers')
    } catch {
      setSubmitError(
        'Erro ao criar corrida. Verifique se o backend estÃ¡ rodando.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0500] px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
          >
            â† Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Criar corrida</h1>
          <p className="mt-1 text-sm text-zinc-400">Passageiro</p>
        </div>

        {/* Allied Driver Card */}
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

        {/* Ride Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">Origem</label>
            <input
              type="text"
              placeholder="Ex: Barra da Tijuca, RJ"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">Destino</label>
            <input
              type="text"
              placeholder="Ex: Aeroporto GaleÃ£o, RJ"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-300">
              HorÃ¡rio da corrida
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
            />
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
  )
}
