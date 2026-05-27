'use client'

// ─── ALIADO Nacional V2 — Node Metrics Panel ──────────────────────────────
// Expandable per-node operational metrics.
// Active (non-zero) values light up in orange; zeros show '--' in muted tone.
// Will "fill in" automatically when the backend ships per-node data (Phase 3).
// ─────────────────────────────────────────────────────────────────────────
import type { FC } from 'react'
import type { ExecutiveGenealogyNode } from '@/types/network-v2'

const MetricItem: FC<{
  label: string
  value: number
  format?: 'currency' | 'number'
}> = ({ label, value, format = 'number' }) => {
  const isActive = value > 0
  const display = isActive
    ? format === 'currency'
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
      : new Intl.NumberFormat('pt-BR').format(value)
    : '--'

  return (
    <div className="flex flex-col items-center rounded-xl border border-[#2E1A08] bg-[#120A02] px-2 py-2 text-center">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9A7D5A]">
        {label}
      </span>
      <span
        className={[
          'mt-0.5 text-xs font-bold transition-colors',
          isActive ? 'text-[#F28C28]' : 'text-[#4A3520]',
        ].join(' ')}
      >
        {display}
      </span>
    </div>
  )
}

export interface NodeMetricsPanelProps {
  node: ExecutiveGenealogyNode
}

export const NodeMetricsPanel: FC<NodeMetricsPanelProps> = ({ node }) => {
  const { metrics } = node
  return (
    <div className="mt-2 grid grid-cols-5 gap-1.5 rounded-xl border border-[#2E1A08] bg-[#0D0700] p-2.5 transition-all duration-200">
      <MetricItem label="Corridas"     value={metrics.completedRides} />
      <MetricItem label="Passageiros"  value={metrics.activePassengers} />
      <MetricItem label="Motoristas"   value={metrics.activeDrivers} />
      <MetricItem label="Revenue"      value={metrics.estimatedRevenueCents} format="currency" />
      <MetricItem label="Profundidade" value={metrics.networkDepth} />
    </div>
  )
}

export default NodeMetricsPanel
