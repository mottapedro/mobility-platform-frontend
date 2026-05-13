'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useDriverNetwork, useDriverNetworkHierarchy } from '../../../hooks/useDriverNetwork'
import { ProtectedRoute } from '../../../components/AuthGuard'
import { AppHeader } from '../../../components/AppHeader'
import { DriverNetworkTree } from '../../../components/driver/DriverNetworkTree'
import { DriverReferralCard } from '../../../components/driver/DriverReferralCard'
import type { DriverNetworkPassenger } from '../../../types'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatLastRide(iso: string | null): string {
  if (!iso) return 'Sem corridas'
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildAvatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || 'AL'
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">{label}</p>
      <p className="text-2xl font-bold text-[#E6D2B3]">{value}</p>
      {sub && <p className="text-xs text-[#E6D2B3]/40">{sub}</p>}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4 animate-pulse">
      <div className="mb-2 h-3 w-24 rounded bg-[#E6D2B3]/10" />
      <div className="h-8 w-16 rounded bg-[#E6D2B3]/10" />
    </div>
  )
}

function SkeletonPassenger() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-full bg-[#E6D2B3]/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-[#E6D2B3]/10" />
        <div className="h-2 w-20 rounded bg-[#E6D2B3]/10" />
      </div>
    </div>
  )
}

// ─── Passenger Row ────────────────────────────────────────────────────────────
function PassengerRow({ passenger }: { passenger: DriverNetworkPassenger }) {
  const frequent = passenger.ridesCount >= 3
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
        frequent
          ? 'border-[#F28C28]/40 bg-[#2B1E15] shadow-[0_0_16px_0_rgba(242,140,40,0.07)]'
          : 'border-[#E6D2B3]/10 bg-[#2B1E15]'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          frequent
            ? 'bg-[#F28C28] text-[#1E140F] ring-2 ring-[#F28C28]/40 ring-offset-1 ring-offset-[#1E140F]'
            : 'bg-[#3B2A1F] text-[#E6D2B3]'
        }`}
      >
        {buildAvatarLabel(passenger.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#E6D2B3]">{passenger.name}</p>
        <p className="text-xs text-[#E6D2B3]/40">{formatLastRide(passenger.lastRideAt)}</p>
      </div>

      {/* Rides badge */}
      <div className="flex flex-col items-end gap-1">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            frequent
              ? 'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30'
              : 'bg-[#E6D2B3]/8 text-[#E6D2B3]/50 border border-[#E6D2B3]/15'
          }`}
        >
          {passenger.ridesCount}×
        </span>
        {frequent && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F28C28]/70">
            Fiel
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DriverNetworkPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [activeTab, setActiveTab] = useState<'passengers' | 'drivers'>('passengers')

  useEffect(() => {
    const id =
      user?.driverId ??
      (typeof window !== 'undefined' ? localStorage.getItem('driverId') : null) ??
      null
    setDriverId(id)
  }, [user])

  const { data, loading, error, refresh } = useDriverNetwork(driverId)
  const { data: hierarchy, loading: hierarchyLoading, error: hierarchyError, refresh: refreshHierarchy } = useDriverNetworkHierarchy(driverId)

  const showError = !!error && !errorDismissed && activeTab === 'passengers'
  const showHierarchyError = !!hierarchyError && activeTab === 'drivers'

  return (
    <ProtectedRoute requiredRole="driver">
      <AppHeader />
      <main className="min-h-screen bg-[#1E140F] px-4 pt-24 pb-10">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/driver/offers')}
              className="mb-4 text-sm text-[#E6D2B3]/40 hover:text-[#F28C28] transition-colors"
            >
              ← Ofertas
            </button>

            {/* Referral card */}
            <div className="mb-6">
              <DriverReferralCard />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#E6D2B3]">Minha Rede</h1>
                <p className="mt-1 text-sm text-[#E6D2B3]/50">Passageiros e motoristas</p>
              </div>
              {activeTab === 'passengers' && !loading && data && (
                <button
                  onClick={refresh}
                  className="rounded-xl border border-[#E6D2B3]/15 px-3 py-1.5 text-xs font-semibold text-[#E6D2B3]/50 transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
                >
                  Atualizar
                </button>
              )}
              {activeTab === 'drivers' && !hierarchyLoading && hierarchy && (
                <button
                  onClick={refreshHierarchy}
                  className="rounded-xl border border-[#E6D2B3]/15 px-3 py-1.5 text-xs font-semibold text-[#E6D2B3]/50 transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
                >
                  Atualizar
                </button>
              )}
            </div>

            {/* Tab switcher */}
            <div className="mt-4 flex rounded-xl border border-[#E6D2B3]/10 bg-[#2B1E15]/60 p-1">
              <button
                onClick={() => setActiveTab('passengers')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'passengers'
                    ? 'bg-[#F28C28] text-[#1E140F] shadow'
                    : 'text-[#E6D2B3]/50 hover:text-[#E6D2B3]'
                }`}
              >
                Passageiros
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'drivers'
                    ? 'bg-[#F28C28] text-[#1E140F] shadow'
                    : 'text-[#E6D2B3]/50 hover:text-[#E6D2B3]'
                }`}
              >
                Motoristas
              </button>
            </div>
          </div>

          {/* Error */}
          {showError && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm text-[#D64545]">
              <span>{error}</span>
              <button
                onClick={() => setErrorDismissed(true)}
                className="ml-4 text-[#D64545]/60 hover:text-[#D64545]"
              >
                ✕
              </button>
            </div>
          )}

          {/* No driver */}
          {!driverId && (
            <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
              <p className="mb-4 text-[#E6D2B3]/60">
                Perfil de motorista não encontrado. Faça login novamente.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#1E140F] hover:opacity-90 transition-opacity"
              >
                Ir para login
              </button>
            </div>
          )}

          {/* Loading — Passengers tab */}
          {activeTab === 'passengers' && driverId && loading && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonPassenger />
              <SkeletonPassenger />
              <SkeletonPassenger />
            </div>
          )}

          {/* Loaded — Passengers tab */}
          {activeTab === 'passengers' && driverId && !loading && data && (
            <div className="flex flex-col gap-6">

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Passageiros"
                  value={String(data.totalPassengers)}
                  sub="vinculados"
                />
                <StatCard
                  label="Corridas"
                  value={String(data.ridesCompleted)}
                  sub="realizadas"
                />
                <StatCard
                  label="Receita"
                  value={formatCurrency(data.estimatedRevenue)}
                  sub="estimada"
                />
              </div>

              {/* Growth badge */}
              {data.totalPassengers > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#3FAE5A]/30 bg-[#3FAE5A]/8 px-4 py-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="text-sm font-semibold text-[#3FAE5A]">Rede crescendo!</p>
                    <p className="text-xs text-[#E6D2B3]/50">
                      {data.totalPassengers === 1
                        ? 'Você tem 1 passageiro na sua rede.'
                        : `Você tem ${data.totalPassengers} passageiros na sua rede.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Recurrence tip */}
              {data.recentPassengers.some((p) => p.ridesCount >= 3) && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#F28C28]/25 bg-[#F28C28]/8 px-4 py-3">
                  <span className="text-xl">⭐</span>
                  <p className="text-xs text-[#E6D2B3]/70">
                    Passageiros com anel laranja são frequentes — eles confiam em você!
                  </p>
                </div>
              )}

              {/* Recent passengers */}
              {data.recentPassengers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#E6D2B3]/40">
                    Passageiros recentes
                  </p>
                  {data.recentPassengers.map((passenger) => (
                    <PassengerRow key={passenger.id} passenger={passenger} />
                  ))}
                </div>
              ) : (
                /* Empty passengers list inside loaded state */
                <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-6 text-center">
                  <p className="text-sm text-[#E6D2B3]/50">
                    Nenhum passageiro recente encontrado.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Empty state — Passengers tab */}
          {activeTab === 'passengers' && driverId && !loading && !data && !error && (
            <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
              <p className="mb-2 text-3xl">🤝</p>
              <p className="mb-1 font-semibold text-[#E6D2B3]">Sua rede está vazia</p>
              <p className="mb-5 text-sm text-[#E6D2B3]/50">
                Compartilhe seu link de indicação e comece a construir sua base de clientes.
              </p>
              <button
                onClick={() => router.push('/driver/offers')}
                className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#1E140F] hover:opacity-90 transition-opacity"
              >
                Ver ofertas
              </button>
            </div>
          )}

          {/* Loading — Drivers tab */}
          {activeTab === 'drivers' && driverId && hierarchyLoading && (
            <div className="flex flex-col items-center gap-3 py-16 text-[#E6D2B3]/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E6D2B3]/20 border-t-[#F28C28]" />
              <p className="text-sm">Carregando rede de motoristas...</p>
            </div>
          )}

          {/* Error — Drivers tab */}
          {showHierarchyError && (
            <div className="mb-4 rounded-xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm text-[#D64545]">
              {hierarchyError}
            </div>
          )}

          {/* Loaded — Drivers tab */}
          {activeTab === 'drivers' && driverId && !hierarchyLoading && hierarchy && (
            <DriverNetworkTree hierarchy={hierarchy} />
          )}

          {/* Empty state — Drivers tab */}
          {activeTab === 'drivers' && driverId && !hierarchyLoading && !hierarchy && !hierarchyError && (
            <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
              <p className="mb-2 text-3xl">🤝</p>
              <p className="mb-1 font-semibold text-[#E6D2B3]">Rede de motoristas vazia</p>
              <p className="text-sm text-[#E6D2B3]/50">
                Quando motoristas se cadastrarem pelo seu link, a hierarquia aparece aqui.
              </p>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  )
}
