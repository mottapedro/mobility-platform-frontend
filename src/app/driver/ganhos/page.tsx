'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useDriverNetwork } from '../../../hooks/useDriverNetwork'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DriverGanhosPage() {
  const { user } = useAuth()
  const [driverId, setDriverId] = useState<string | null>(null)
  const { data, loading, error } = useDriverNetwork(driverId)

  useEffect(() => {
    const id =
      user?.driverId ??
      (typeof window !== 'undefined' ? localStorage.getItem('driverId') : null) ??
      null
    setDriverId(id)
  }, [user])

  const stats = data
    ? {
        passengers: data.totalPassengers,
        rides: data.ridesCompleted,
        revenue: data.estimatedRevenue,
      }
    : null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E6D2B3]">Ganhos</h1>
        <p className="mt-1 text-sm text-[#E6D2B3]/50">Resumo da sua rede</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#D64545]/30 bg-[#D64545]/10 px-4 py-3 text-sm text-[#D64545]">
          {error}
        </div>
      )}

      {loading && !stats && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15]" />
          ))}
        </div>
      )}

      {stats && (
        <div className="flex flex-col gap-4">
          <StatCard
            label="Receita estimada"
            value={formatCurrency(stats.revenue)}
            sub="da sua rede de passageiros"
            highlight
          />
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Passageiros"
              value={String(stats.passengers)}
              sub="vinculados"
            />
            <StatCard
              label="Corridas"
              value={String(stats.rides)}
              sub="realizadas"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[#F28C28]/20 bg-[#F28C28]/5 p-5">
            <p className="mb-1 text-sm font-semibold text-[#F28C28]">Como aumentar seus ganhos?</p>
            <ul className="space-y-2 text-xs text-[#E6D2B3]/60">
              <li>• Compartilhe seu link de indicação com mais pessoas</li>
              <li>• Indique outros motoristas para sua rede</li>
              <li>• Mantenha seus passageiros satisfeitos para recorrência</li>
            </ul>
          </div>
        </div>
      )}

      {!loading && !stats && !error && (
        <div className="rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-8 text-center">
          <p className="mb-2 text-3xl">💰</p>
          <p className="font-semibold text-[#E6D2B3]">Nenhum dado ainda</p>
          <p className="mt-1 text-sm text-[#E6D2B3]/50">
            Seus ganhos aparecerão aqui conforme sua rede cresce.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-5 ${
        highlight
          ? 'border-[#F28C28]/30 bg-[#F28C28]/8'
          : 'border-[#E6D2B3]/10 bg-[#2B1E15]'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">
        {label}
      </p>
      <p className={`text-3xl font-bold ${highlight ? 'text-[#F28C28]' : 'text-[#E6D2B3]'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#E6D2B3]/40">{sub}</p>}
    </div>
  )
}
