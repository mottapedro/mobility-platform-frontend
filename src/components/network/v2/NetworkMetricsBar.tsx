'use client'

import type { FC } from 'react'
import type { NetworkMetrics } from '@/types/network-v2'
import { MetricCard } from '@/design-system'

export interface NetworkMetricsBarProps {
  metrics: NetworkMetrics
  className?: string
  /** Passenger flows earn cashback, not commission/revenue — swaps the label. */
  isPassenger?: boolean
}

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('pt-BR').format(value)

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

/**
 * ALIADO Nacional V2 — top-of-page metrics strip for any network view.
 * Pure presentation: backend-provided `NetworkMetrics` only.
 */
export const NetworkMetricsBar: FC<NetworkMetricsBarProps> = ({
  metrics,
  className = '',
  isPassenger = false,
}) => {
  const growth7 = metrics.growth?.last7Days
  const growth30 = metrics.growth?.last30Days
  const growthSub =
    growth7 != null || growth30 != null
      ? `+${growth7 ?? 0} (7d) · +${growth30 ?? 0} (30d)`
      : undefined

  return (
    <div
      data-testid="network-metrics-bar"
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
    >
      <MetricCard
        label="Rede total"
        value={formatNumber(metrics.totalActors)}
        sub={`${formatNumber(metrics.activeCount)} ativos`}
        highlight
      />
      <MetricCard
        label="Profundidade"
        value={formatNumber(metrics.depth)}
        sub={growthSub}
      />
      {metrics.ridesFromNetwork != null && (
        <MetricCard
          label={isPassenger ? 'Corridas da rede' : 'Corridas liquidadas'}
          value={formatNumber(metrics.ridesFromNetwork)}
          sub={isPassenger ? undefined : 'Últimos 30 dias'}
        />
      )}
      {metrics.estimatedRevenue != null && (
        <MetricCard
          label={isPassenger ? 'Cashback estimado' : 'Receita liquidada da rede'}
          value={formatCurrency(metrics.estimatedRevenue)}
          sub={isPassenger ? undefined : 'Últimos 30 dias'}
        />
      )}
    </div>
  )
}

export default NetworkMetricsBar
