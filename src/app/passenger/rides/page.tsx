'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRide } from '../../../services/rides'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import type { Ride, RideStatus } from '../../../types'

function rideStatusLabel(status: RideStatus): string {
  switch (status) {
    case 'WAITING_REFERRAL':
      return 'Aguardando seu motorista'
    case 'MATCHING':
      return 'Buscando motoristas'
    case 'PENDING':
    case 'WAITING_DRIVER':
      return 'Aguardando'
    case 'ACCEPTED':
      return 'Motorista confirmado'
    case 'REJECTED':
    case 'EXPIRED':
      return 'Encerrada'
    default:
      return status
  }
}

function rideStatusStyle(status: RideStatus): string {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-[#3FAE5A]/15 text-[#3FAE5A] border border-[#3FAE5A]/30'
    case 'REJECTED':
    case 'EXPIRED':
      return 'bg-[#D64545]/15 text-[#D64545] border border-[#D64545]/30'
    case 'WAITING_REFERRAL':
      return 'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30'
    case 'MATCHING':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
    default:
      return 'bg-[#E6D2B3]/8 text-[#E6D2B3]/50 border border-[#E6D2B3]/15'
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
      <main className="min-h-screen bg-[#1E140F] px-4 pt-24 pb-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-sm text-[#E6D2B3]/40 hover:text-[#F28C28] transition-colors"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#E6D2B3]">Minhas corridas</h1>
                <p className="mt-1 text-sm text-[#E6D2B3]/50">Passageiro</p>
              </div>
              <button
                onClick={() => router.push('/passenger/create')}
                className="rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#1E140F] hover:opacity-90 transition-opacity active:scale-95"
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
                  className="h-28 animate-pulse rounded-2xl border border-[#E6D2B3]/8 bg-[#2B1E15]/50"
                />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm text-[#D64545]">
              {error}
            </p>
          )}

          {!loading && !error && rides.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <span className="text-5xl">🚗</span>
              <p className="text-[#E6D2B3]/50">Você ainda não criou nenhuma corrida.</p>
              <button
                onClick={() => router.push('/passenger/create')}
                className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#1E140F] hover:opacity-90 transition-opacity active:scale-95"
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
                    className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-[#E6D2B3]/70">
                          <span className="text-[#F28C28]">●</span>
                          <span className="truncate">{ride.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#E6D2B3]/50">
                          <span className="text-[#E6D2B3]/20">●</span>
                          <span className="truncate">{ride.destination}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${rideStatusStyle(ride.status)}`}
                      >
                        {rideStatusLabel(ride.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E6D2B3]/8 pt-2">
                      <p className="text-xs text-[#E6D2B3]/40">
                        {formatDate(ride.scheduledAt)}
                      </p>
                      <p className="text-xs text-[#E6D2B3]/20">
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
              className="mt-6 w-full rounded-xl border border-[#E6D2B3]/10 py-3 text-sm text-[#E6D2B3]/40 hover:border-[#F28C28]/40 hover:text-[#F28C28] transition-colors"
            >
              Atualizar lista
            </button>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
