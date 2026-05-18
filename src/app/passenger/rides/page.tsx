'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRide } from '../../../services/rides'
import { usePassenger } from '../../../hooks/usePassenger'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import { useAuth } from '../../../contexts/AuthContext'
import { formatDriverPhone, type DriverReferralProfile } from '../../../services/drivers'
import type { Driver, Ride, RideStatus } from '../../../types'

type StoredReferralDriver = {
  id: string
  name: string
  phone: string
  avatarLabel?: string
  regionLabel?: string
  vehicleLabel?: string
  ratingLabel?: string
  headline?: string
  phoneLabel?: string
} & Partial<DriverReferralProfile>

type AlliedDriverCardData = {
  avatarLabel: string
  name: string
  phoneLabel: string
  regionLabel: string
  vehicleLabel: string
  ratingLabel: string
  headline: string
}

function buildAvatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

function toAlliedDriverCardData(driver: Driver | null, storedDriver: StoredReferralDriver | null): AlliedDriverCardData | null {
  const name = driver?.user.name ?? storedDriver?.name
  if (!name) return null

  const backendVehicle = driver?.vehicles[0]
  const vehicleLabel = backendVehicle
    ? [backendVehicle.brand, backendVehicle.model].filter(Boolean).join(' ')
    : storedDriver?.vehicleLabel || 'VeÃ­culo sob consulta'

  const phone = driver?.user.phone ?? storedDriver?.phone ?? ''

  return {
    avatarLabel: storedDriver?.avatarLabel || buildAvatarLabel(name),
    name,
    phoneLabel: storedDriver?.phoneLabel || (phone ? formatDriverPhone(phone) : 'Contato sob consulta'),
    regionLabel: storedDriver?.regionLabel || 'Atendimento sob consulta',
    vehicleLabel,
    ratingLabel: storedDriver?.ratingLabel || 'Em breve',
    headline: storedDriver?.headline || 'Seu parceiro de confiança para corridas com prioridade e atendimento mais pessoal.',
  }
}

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
  const { user } = useAuth()
  const passengerId = user?.passengerId ?? ''
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: passenger, loading: loadingPassenger, error: passengerError } = usePassenger(passengerId)
  const [storedDriver, setStoredDriver] = useState<StoredReferralDriver | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aliado:referredDriver')
      if (stored) setStoredDriver(JSON.parse(stored))
    } catch {
      setStoredDriver(null)
    }
  }, [])

  const alliedDriver = toAlliedDriverCardData(passenger?.referredByDriver ?? null, storedDriver)
  const showAlliedDriverError = Boolean(passengerError && !alliedDriver)

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
              â† Voltar
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#E6D2B3]">Minhas corridas</h1>
                <p className="mt-1 text-sm text-[#E6D2B3]/50">Passageiro</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  📍 Motoristas da sua região
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/passenger/network')}
                  className="rounded-xl border border-[#E6D2B3]/15 px-4 py-2 text-sm font-bold text-[#E6D2B3]/60 transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
                >
                  Minha Rede
                </button>
                <button
                  onClick={() => router.push('/passenger/create')}
                  className="rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#1E140F] hover:opacity-90 transition-opacity active:scale-95"
                >
                  Solicitar corrida
                </button>
              </div>
            </div>
          </div>

          <section className="mb-6 rounded-[1.75rem] border border-[#F28C28]/20 bg-[linear-gradient(180deg,rgba(242,140,40,0.12),rgba(43,30,21,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
                  Meu motorista aliado
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#E6D2B3]">Seu motorista pessoal no app</h2>
                <p className="mt-2 text-sm leading-6 text-[#E6D2B3]/65">
                  Relação persistente para gerar confiança, prioridade e uma experiência mais próxima a cada solicitação.
                </p>
              </div>
              {alliedDriver && (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 text-lg font-bold text-[#FAD2A4]">
                  {alliedDriver.avatarLabel}
                </div>
              )}
            </div>

            {loadingPassenger && !alliedDriver && (
              <div className="mt-5 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15]/80 p-4 text-sm text-[#E6D2B3]/40">
                Carregando seu motorista aliado...
              </div>
            )}

            {showAlliedDriverError && (
              <div className="mt-5 rounded-2xl border border-[#D64545]/25 bg-[#D64545]/10 p-4 text-sm text-[#D64545]">
                NÃ£o foi possÃ­vel carregar seu motorista aliado agora.
              </div>
            )}

            {alliedDriver && (
              <div className="mt-5 rounded-[1.5rem] border border-[#F28C28]/20 bg-[#2B1E15]/92 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F28C28] text-sm font-bold text-[#1E140F]">
                    {alliedDriver.avatarLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[#E6D2B3]">{alliedDriver.name}</p>
                    <p className="truncate text-xs text-[#E6D2B3]/45">{alliedDriver.headline}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#E6D2B3]/10 bg-black/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F28C28]/70">VEÍCULO</p>
                    <p className="mt-2 text-sm font-medium text-[#E6D2B3]">{alliedDriver.vehicleLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E6D2B3]/10 bg-black/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F28C28]/70">REGIÃO</p>
                    <p className="mt-2 text-sm font-medium text-[#E6D2B3]">{alliedDriver.regionLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E6D2B3]/10 bg-black/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F28C28]/70">Nota</p>
                    <p className="mt-2 text-sm font-medium text-[#E6D2B3]">{alliedDriver.ratingLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E6D2B3]/10 bg-black/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F28C28]/70">Contato</p>
                    <p className="mt-2 text-sm font-medium text-[#E6D2B3]">{alliedDriver.phoneLabel}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/passenger/create')}
                  className="mt-4 w-full rounded-2xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#1E140F] transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                  Solicitar corrida
                </button>
              </div>
            )}

            {!loadingPassenger && !alliedDriver && !showAlliedDriverError && (
              <div className="mt-5 rounded-[1.5rem] border border-[#E6D2B3]/10 bg-[#2B1E15]/92 p-4">
                <p className="text-base font-semibold text-[#E6D2B3]">Nenhum motorista aliado vinculado</p>
                <p className="mt-2 text-sm leading-6 text-[#E6D2B3]/55">
                  Quando você se cadastra por indicação, esse relacionamento fica salvo aqui para reforçar confiança e prioridade nas próximas corridas.
                </p>
                <button
                  onClick={() => router.push('/passenger/create')}
                  className="mt-4 w-full rounded-2xl border border-[#F28C28]/30 px-4 py-3 text-sm font-semibold text-[#F28C28] transition-colors hover:border-[#F28C28] hover:bg-[#F28C28]/10"
                >
                  Solicitar corrida
                </button>
              </div>
            )}
          </section>

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
              <img src="/logo-alidado.jpeg" alt="Logo Aliado" className="mx-auto mb-2 h-24 w-auto" />
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
                          <span className="text-[#F28C28]">â—</span>
                          <span className="truncate">{ride.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#E6D2B3]/50">
                          <span className="text-[#E6D2B3]/20">â—</span>
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

