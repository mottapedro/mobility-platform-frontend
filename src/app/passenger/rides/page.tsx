'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRide } from '../../../services/rides'
import { useAlliedDriver } from '../../../hooks/useAlliedDriver'
import { AlliedDriverCard } from '../../../components/passenger/AlliedDriverCard'
import { PixModal } from '../../../components/payment/PixModal'
import { useAuth } from '../../../contexts/AuthContext'
import { formatPrice } from '../../../utils/pricing'
import type { Ride, RideStatus } from '../../../types'

function rideStatusLabel(status: RideStatus): string {
  switch (status) {
    case 'WAITING_REFERRAL':
      return 'Aguardando seu motorista'
    case 'MATCHING':
      return 'Buscando motoristas'
    case 'PENDING':
    case 'WAITING_DRIVER':
    case 'WAITING_GENERAL':
      return 'Aguardando'
    case 'WAITING_PARTNER':
      return 'Aguardando motorista parceiro'
    case 'MATCHED':
    case 'ACCEPTED':
      return 'Motorista confirmado'
    case 'IN_PROGRESS':
      return '🚗 A caminho'
    case 'COMPLETED':
      return 'Corrida finalizada'
    case 'CANCELLED':
      return 'Cancelada'
    case 'REJECTED':
    case 'EXPIRED':
      return 'Encerrada'
    default:
      return status
  }
}

function rideStatusStyle(status: RideStatus): string {
  switch (status) {
    case 'MATCHED':
    case 'ACCEPTED':
      return 'bg-[#3DB87A]/15 text-[#3DB87A] border border-[#3DB87A]/30'
    case 'IN_PROGRESS':
      return 'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30'
    case 'COMPLETED':
      return 'bg-[#3DB87A]/15 text-[#3DB87A] border border-[#3DB87A]/30'
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
      return 'bg-[#E05050]/15 text-[#E05050] border border-[#E05050]/30'
    case 'WAITING_REFERRAL':
      return 'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30'
    case 'MATCHING':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
    default:
      return 'bg-[#2E1A08] text-[#9A7D5A] border border-[#2E1A08]'
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
  const { user } = useAuth()
  const passengerId = user?.passengerId ?? ''
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pixRideId, setPixRideId] = useState<string | null>(null)
  const { alliedDriver, loading: loadingPassenger, error: passengerError } = useAlliedDriver(passengerId)

  const fetchRides = useCallback(async () => {
    const stored = localStorage.getItem('passengerRideIds')
    const ids: string[] = stored ? JSON.parse(stored) : []
    if (ids.length === 0) {
      setLoading(false)
      setRides([])
      return
    }
    setLoading(true)
    setError(null)

    const results = await Promise.allSettled(ids.map((id) => getRide(id)))
    const loaded: Ride[] = []
    const ghostIds: string[] = []

    for (let i = 0; i < results.length; i++) {
      const id = ids[i]
      const r = results[i]
      if (r.status === 'fulfilled') {
        loaded.push(r.value)
      } else {
        // Check if it's a 404 — ghost ride that no longer exists
        const reason = r.reason
        if (
          reason &&
          typeof reason === 'object' &&
          'status' in reason &&
          (reason as { status: number }).status === 404
        ) {
          ghostIds.push(id)
        }
      }
    }

    // Silently remove ghost (404) IDs from localStorage so polling stops retrying them
    if (ghostIds.length > 0) {
      const remaining = ids.filter((x) => !ghostIds.includes(x))
      localStorage.setItem('passengerRideIds', JSON.stringify(remaining))
    }

    setRides(loaded)

    if (results.length > 0 && loaded.length === 0 && ghostIds.length === 0) {
      setError('Erro ao carregar corridas.')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRides()
    const interval = setInterval(fetchRides, 5000)
    return () => clearInterval(interval)
  }, [fetchRides])

  return (
    <div className="mx-auto max-w-lg">
      {pixRideId && (
        <PixModal
          rideId={pixRideId}
          priceBrl={rides.find(r => r.id === pixRideId)?.priceBrl}
          onClose={() => setPixRideId(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5ECD8]">Minhas corridas</h1>
        <p className="mt-1 text-sm text-[#9A7D5A]">Passageiro ALIADO</p>
      </div>

      <section className="mb-6">
        <AlliedDriverCard
          driver={alliedDriver}
          loading={loadingPassenger}
          error={Boolean(passengerError && !alliedDriver)}
          onRequestRide={() => router.push('/passenger/create')}
        />
      </section>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04]/50" />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]">
          {error}
        </p>
      )}

      {!loading && !error && rides.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-[#9A7D5A]">Você ainda não criou nenhuma corrida.</p>
          <button
            onClick={() => router.push('/passenger/create')}
            className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#0D0700] hover:opacity-90 transition-opacity active:scale-95"
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
              <div key={ride.id} className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-[#F5ECD8]/70">
                      <span className="text-[#F28C28]">◉</span>
                      <span className="truncate">{ride.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#9A7D5A]">
                      <span className="text-[#5A3F22]">◉</span>
                      <span className="truncate">{ride.destination}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${rideStatusStyle(ride.status)}`}>
                    {rideStatusLabel(ride.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#2E1A08] pt-2">
                  <p className="text-xs text-[#9A7D5A]">{formatDate(ride.scheduledAt)}</p>
                  {ride.priceBrl != null ? (
                    <p className="text-xs font-bold text-[#3DB87A]">{formatPrice(ride.priceBrl)}</p>
                  ) : (
                    <p className="text-xs text-[#5A3F22]">#{ride.id.slice(0, 8)}</p>
                  )}
                </div>
                {(ride.status === 'ACCEPTED' || ride.status === 'MATCHED' || ride.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => setPixRideId(ride.id)}
                    className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-[#3DB87A]/30 bg-[#3DB87A]/10 px-4 py-2.5 text-sm font-semibold text-[#3DB87A] transition-colors hover:border-[#3DB87A]/60 hover:bg-[#3DB87A]/15"
                  >
                    <span>💳</span> Pagar via PIX
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {!loading && rides.length > 0 && (
        <button
          onClick={fetchRides}
          className="mt-6 w-full rounded-xl border border-[#2E1A08] py-3 text-sm text-[#9A7D5A] hover:border-[#F28C28]/40 hover:text-[#F28C28] transition-colors"
        >
          Atualizar lista
        </button>
      )}
    </div>
  )
}

