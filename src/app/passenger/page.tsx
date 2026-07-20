'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useAlliedDriver } from '../../hooks/useAlliedDriver'
import { AlliedDriverCard } from '../../components/passenger/AlliedDriverCard'
import { getRide } from '../../services/rides'
import type { Ride } from '../../types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? 'Passageiro'
}

// Mirrors the full status mapping in /passenger/rides — kept local since
// this widget only needs the label/color, not the fuller card styling.
function rideStatusLabel(status: string): string {
  switch (status) {
    case 'WAITING_REFERRAL': return 'Aguardando seu motorista'
    case 'MATCHING': return 'Buscando motoristas'
    case 'PENDING':
    case 'WAITING_DRIVER':
    case 'WAITING_GENERAL': return 'Aguardando'
    case 'WAITING_PARTNER': return 'Aguardando motorista parceiro'
    case 'MATCHED':
    case 'ACCEPTED': return 'Motorista confirmado'
    case 'STARTED':
    case 'IN_PROGRESS': return '🚗 A caminho'
    case 'COMPLETED': return 'Corrida finalizada'
    case 'CANCELLED': return 'Cancelada'
    case 'REJECTED':
    case 'EXPIRED': return 'Encerrada'
    default: return status
  }
}

function rideStatusColor(status: string): string {
  switch (status) {
    case 'MATCHED':
    case 'ACCEPTED':
    case 'COMPLETED': return 'text-[#3DB87A]'
    case 'STARTED':
    case 'IN_PROGRESS':
    case 'WAITING_REFERRAL': return 'text-[#F28C28]'
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED': return 'text-[#E05050]'
    default: return 'text-[#9A7D5A]'
  }
}

export default function PassengerHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const passengerId = user?.passengerId ?? ''
  const { alliedDriver, loading, error } = useAlliedDriver(passengerId)

  const [recentRides, setRecentRides] = useState<Ride[]>([])
  const [loadingRides, setLoadingRides] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const stored = localStorage.getItem('passengerRideIds')
        const ids: string[] = stored ? JSON.parse(stored) : []
        if (ids.length === 0) {
          setLoadingRides(false)
          return
        }

        // Bounded to 3 ids, fetched in parallel — not a waterfall.
        const results = await Promise.allSettled(ids.slice(0, 3).map((id) => getRide(id)))
        if (cancelled) return

        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Ride> => r.status === 'fulfilled')
          .map((r) => r.value)
        setRecentRides(loaded)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingRides(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-lg">
      {/* Greeting */}
      <section className="animate-[fadeUp_0.4s_ease-out] mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F28C28]/75">
          {getGreeting()},
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#F5ECD8]">{firstName(user?.name)} 👋</h1>
        <p className="mt-2 text-sm leading-6 text-[#9A7D5A]">
          Bem-vindo ao seu painel concierge ALIADO.
        </p>
      </section>

      {/* Allied driver card */}
      <section className="animate-[fadeUp_0.5s_ease-out] mb-6">
        <AlliedDriverCard
          driver={alliedDriver}
          loading={loading}
          error={error}
          onRequestRide={() => router.push('/passenger/create')}
        />
      </section>

      {/* Quick actions */}
      <section className="animate-[fadeUp_0.6s_ease-out] mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/passenger/create')}
          className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-left transition-all hover:border-[#F28C28]/60 hover:bg-[#F28C28]/15 active:scale-[0.98]"
        >
          <span className="text-3xl">🚗</span>
          <span className="text-sm font-semibold text-[#F28C28]">Solicitar corrida</span>
        </button>
        <button
          onClick={() => router.push('/passenger/rides')}
          className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-[#2E1A08] bg-[#1A0E04] p-4 text-left transition-all hover:border-[#5A3F22] active:scale-[0.98]"
        >
          <span className="text-3xl">📋</span>
          <span className="text-sm font-semibold text-[#F5ECD8]">Minhas corridas</span>
        </button>
      </section>

      {/* Recent rides mini-list */}
      {recentRides.length > 0 && (
        <section className="animate-[fadeUp_0.7s_ease-out]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9A7D5A]">
              Corridas recentes
            </h2>
            <button
              onClick={() => router.push('/passenger/rides')}
              className="text-xs text-[#F28C28] hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentRides.map((ride) => (
              <button
                key={ride.id}
                onClick={() => router.push('/passenger/rides')}
                className="flex items-center justify-between rounded-2xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-3 text-left transition-colors hover:border-[#2E1A08]"
              >
                <p className="text-xs text-[#9A7D5A]">#{ride.id.slice(0, 8)}</p>
                <p className={`text-xs font-semibold ${rideStatusColor(ride.status)}`}>
                  {rideStatusLabel(ride.status)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {recentRides.length === 0 && !loading && !loadingRides && (
        <section className="animate-[fadeUp_0.7s_ease-out] rounded-[1.5rem] border border-[#2E1A08] bg-[#1A0E04] p-6 text-center">
          <p className="mb-3 text-[#9A7D5A]">Você ainda não tem corridas.</p>
          <button
            onClick={() => router.push('/passenger/create')}
            className="rounded-2xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#0D0700] transition-opacity hover:opacity-90"
          >
            Criar primeira corrida
          </button>
        </section>
      )}
    </div>
  )
}
