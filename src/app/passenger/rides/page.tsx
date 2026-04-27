'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRide } from '../../../services/rides'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import type { Ride, RideStatus } from '../../../types'

function rideStatusLabel(status: RideStatus): string {
  switch (status) {
    case 'PENDING':
    case 'MATCHING':
    case 'WAITING_DRIVER':
      return 'Pendente'
    case 'ACCEPTED':
      return 'Aceita'
    case 'EXPIRED':
      return 'Rejeitada'
    default:
      return status
  }
}

function rideStatusStyle(status: RideStatus): string {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-green-500/15 text-green-400 border border-green-500/30'
    case 'EXPIRED':
      return 'bg-red-500/15 text-red-400 border border-red-500/30'
    default:
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PassengerRidesPage() {
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRides = useCallback(async () => {
    const stored = localStorage.getItem('passengerRideIds')
    const ids: string[] = stored ? JSON.parse(stored) : []
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled(ids.map((id) => getRide(id)))
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<Ride> => r.status === 'fulfilled')
        .map((r) => r.value)
      setRides(loaded)
    } catch {
      setError('Erro ao carregar corridas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  return (
    <ProtectedRoute requiredRole="passenger">
      <AppHeader />
      <main className="min-h-screen bg-[#0a0500] px-4 pt-24 pb-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Minhas corridas</h1>
                <p className="mt-1 text-sm text-zinc-400">Passageiro</p>
              </div>
              <button
                onClick={() => router.push('/passenger/create')}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors active:scale-95"
              >
                + Nova
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
                />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          {!loading && !error && rides.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <span className="text-5xl">🚗</span>
              <p className="text-zinc-400">Você ainda não criou nenhuma corrida.</p>
              <button
                onClick={() => router.push('/passenger/create')}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors active:scale-95"
              >
                Criar primeira corrida
              </button>
            </div>
          )}

          {!loading && !error && rides.length > 0 && (
            <div className="flex flex-col gap-3">
              {rides
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((ride) => (
                  <div
                    key={ride.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="text-orange-400">●</span>
                          <span className="truncate">{ride.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="text-zinc-500">●</span>
                          <span className="truncate">{ride.destination}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${rideStatusStyle(ride.status)}`}
                      >
                        {rideStatusLabel(ride.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
                      <p className="text-xs text-zinc-500">
                        {formatDate(ride.scheduledAt)}
                      </p>
                      <p className="text-xs text-zinc-600">
                        #{ride.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {!loading && rides.length > 0 && (
            <button
              onClick={fetchRides}
              className="mt-6 w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 hover:border-orange-500/40 hover:text-orange-400 transition-colors"
            >
              Atualizar lista
            </button>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
