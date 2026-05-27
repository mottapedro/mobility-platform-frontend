'use client'

// ─── ALIADO Nacional V2 — Cluster Group ───────────────────────────────────
// Groups related nodes (hubs, drivers, passengers) into a labeled container.
// Used inside ProjectionTree (hierarchy mode) and LateralNetwork.
// ─────────────────────────────────────────────────────────────────────────
import type { FC, ReactNode } from 'react'
import { NETWORK_CLUSTER_STYLES, type NetworkClusterVariant } from './styles'

export type ClusterVariant = NetworkClusterVariant

export interface ClusterGroupProps {
  variant: ClusterVariant
  count: number
  label?: string
  children: ReactNode
  className?: string
}

export const ClusterGroup: FC<ClusterGroupProps> = ({
  variant,
  count,
  label,
  children,
  className = '',
}) => {
  const style = NETWORK_CLUSTER_STYLES[variant]
  const displayLabel = label ?? style.defaultLabel

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Cluster header */}
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
          {displayLabel}
        </span>
        <span
          className={`ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${style.text} ${style.border}`}
        >
          {count}
        </span>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

export default ClusterGroup
