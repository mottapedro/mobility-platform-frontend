'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverRides } from '../../../hooks/useDriverRides'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import { useAuth } from '../../../contexts/AuthContext'
import type { DriverRide, RideContext } from '../../../types'

export default function DriverRidesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)

  useEffect(() => {
    const id =
      user?.driverId ??
      (typeof window !== 'undefined' ? localStorage.getItem('driverId') : null) ??
      null
    setDriverId(id)
  }, [user])

  const { rides, loading, error } = useDriverRides(driverId)

  return (
    <ProtectedRoute requiredRole="driver">
      <AppHeader />
      <main className="min-h-screen bg-[#0a0a0a] px-4 pt-24 pb-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-white">Minhas Corridas</h1>
            <p className="mt-1 text-sm text-zinc-400">Corridas confirmadas</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!driverId && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">
                Motorista não identificado. Faça login novamente.
              </p>
            </div>
          )}

          {driverId && loading && rides.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
              <p className="text-sm">Carregando corridas...</p>
            </div>
          )}

          {driverId && !loading && rides.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">Nenhuma corrida confirmada.</p>
            </div>
          )}

          {rides.length > 0 && (
            <div className="flex flex-col gap-4">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}

function RideCard({ ride }: { ride: DriverRide }) {
  const passenger = ride.passenger.user
  const context = ride.context as RideContext | null
  const scheduledDate = new Date(ride.scheduledAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {passenger.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Passageiro
            </p>
            <p className="font-semibold text-white">{passenger.name}</p>
            {passenger.phone && (
              <p className="text-xs text-zinc-500">{passenger.phone}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
          ✅ Confirmada
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
        <p className="text-zinc-400">
          <span className="font-semibold text-orange-400">De:</span>{' '}
          <span className="text-white">{ride.origin}</span>
        </p>
        <p className="text-zinc-400">
          <span className="font-semibold text-orange-400">Para:</span>{' '}
          <span className="text-white">{ride.destination}</span>
        </p>
        <p className="text-zinc-400">
          <span className="font-semibold text-orange-400">Horário:</span>{' '}
          <span className="text-white">{scheduledDate}</span>
        </p>
      </div>

      {context && (context.isVip || context.isAirport || context.isPet || context.isLuggage) && (
        <div className="flex flex-wrap gap-2">
          {context.isVip     && <Badge>⭐ VIP</Badge>}
          {context.isAirport && <Badge>✈️ Aeroporto</Badge>}
          {context.isPet     && <Badge>🐶 Pet</Badge>}
          {context.isLuggage && <Badge>💼 Bagagem</Badge>}
        </div>
      )}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
      {children}
    </span>
  )
}
