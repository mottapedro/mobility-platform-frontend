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
      <main className="min-h-screen bg-[#1E140F] px-4 pt-24 pb-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-[#E6D2B3]/40 hover:text-[#F28C28] transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={() => router.push('/driver/network')}
                className="ml-auto rounded-xl border border-[#E6D2B3]/15 px-3 py-1.5 text-xs font-semibold text-[#E6D2B3]/50 transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
              >
                Minha Rede →
              </button>
            </div>
            <h1 className="text-2xl font-bold text-[#E6D2B3]">Agenda</h1>
            <p className="mt-1 text-sm text-[#E6D2B3]/50">Corridas confirmadas</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm text-[#D64545]">
              {error}
            </div>
          )}

          {!driverId && (
            <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
              <p className="text-sm text-[#E6D2B3]/50">
                Motorista não identificado. Faça login novamente.
              </p>
            </div>
          )}

          {driverId && loading && rides.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-[#E6D2B3]/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E6D2B3]/20 border-t-[#F28C28]" />
              <p className="text-sm">Carregando agenda...</p>
            </div>
          )}

          {driverId && !loading && rides.length === 0 && (
            <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
              <p className="text-sm text-[#E6D2B3]/50">Nenhuma corrida confirmada.</p>
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
    <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F28C28] text-sm font-bold text-[#1E140F]">
            {passenger.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E6D2B3]/40">
              Passageiro
            </p>
            <p className="font-semibold text-[#E6D2B3]">{passenger.name}</p>
            {passenger.phone && (
              <p className="text-xs text-[#E6D2B3]/40">{passenger.phone}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#3FAE5A]/30 bg-[#3FAE5A]/10 px-3 py-1 text-xs font-semibold text-[#3FAE5A]">
          ✓ Confirmada
        </span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-[#E6D2B3]/8 bg-[#1E140F]/60 px-4 py-3 text-sm">
        <p className="text-[#E6D2B3]/70">
          <span className="font-semibold text-[#F28C28]">De:</span>{' '}
          <span className="text-[#E6D2B3]">{ride.origin}</span>
        </p>
        <p className="text-[#E6D2B3]/70">
          <span className="font-semibold text-[#F28C28]">Para:</span>{' '}
          <span className="text-[#E6D2B3]">{ride.destination}</span>
        </p>
        <p className="text-[#E6D2B3]/70">
          <span className="font-semibold text-[#F28C28]">Horário:</span>{' '}
          <span className="text-[#E6D2B3]">{scheduledDate}</span>
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
    <span className="rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-2.5 py-1 text-xs font-semibold text-[#F28C28]">
      {children}
    </span>
  )
}
