'use client'

// ─── ALIADO Nacional V2 — Cluster Group ───────────────────────────────────
// Groups related nodes (hubs, drivers, passengers) into a labeled container.
// Used inside ProjectionTree (hierarchy mode) and LateralNetwork.
// ─────────────────────────────────────────────────────────────────────────
import type { FC, ReactNode } from 'react'

export type ClusterVariant = 'hub' | 'driver' | 'passenger' | 'indirect'

const CLUSTER_STYLES: Record<
  ClusterVariant,
  { defaultLabel: string; dot: string; border: string; text: string }
> = {
  hub:       { defaultLabel: 'HUBS OPERACIONAIS', dot: 'bg-[#3DB87A]',    border: 'border-[#3DB87A]/20', text: 'text-[#3DB87A]' },
  driver:    { defaultLabel: 'REDE D2D',          dot: 'bg-[#F28C28]',    border: 'border-[#F28C28]/15', text: 'text-[#F28C28]/70' },
  passenger: { defaultLabel: 'EXPANSÃO D2P',      dot: 'bg-[#9A7D5A]',    border: 'border-[#9A7D5A]/20', text: 'text-[#9A7D5A]' },
  indirect:  { defaultLabel: 'REDE INDIRETA',     dot: 'bg-[#5A3F22]',    border: 'border-[#5A3F22]/20', text: 'text-[#5A3F22]' },
}

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
  const style = CLUSTER_STYLES[variant]
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
