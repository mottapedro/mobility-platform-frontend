'use client'

import { NetworkTree, type NetworkHierarchy } from '../network/NetworkTree'
import type { DriverNetworkHierarchy } from '../../types'

interface DriverNetworkTreeProps {
  hierarchy?: DriverNetworkHierarchy | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function DriverNetworkTree({ hierarchy, loading, error, onRetry }: DriverNetworkTreeProps) {
  const mappedHierarchy: NetworkHierarchy | null = hierarchy
    ? {
        me: hierarchy.me,
        referredBy: hierarchy.referredBy,
        referrals: hierarchy.referrals,
        totalItems: hierarchy.totalDrivers,
        maxDepth: hierarchy.maxDepth,
      }
    : null

  return (
    <NetworkTree
      hierarchy={mappedHierarchy}
      loading={loading}
      error={error}
      onRetry={onRetry}
      labels={{
        loadingAriaLabel: 'Carregando rede de motoristas',
        loadingText: 'Carregando rede de motoristas...',
        primaryTab: 'Hierarquia',
        statsTab: 'Estatísticas',
        totalLabel: 'Motoristas',
        totalSub: 'na sua rede',
        depthLabel: 'Profundidade',
        depthSub: 'níveis',
        referredByTitle: 'Quem te indicou',
        referredByBadge: 'Te indicou',
        rootTitle: 'Você - origem da rede',
        referralsTitle: 'Motoristas indicados',
        emptyTitle: 'Nenhum motorista indicado ainda.',
        emptyHint: 'Compartilhe seu codigo para expandir sua rede.',
        meBadge: 'Você',
      }}
    />
  )
}
