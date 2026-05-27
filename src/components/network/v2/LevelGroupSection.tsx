'use client'

// ─── ALIADO Nacional V2 — Level Group Section ─────────────────────────────
// Decorative header that separates nodes by their depth level.
// Used by ProjectionTree (level view) and GenealogySocial (descendants).
// ─────────────────────────────────────────────────────────────────────────
import type { FC, ReactNode } from 'react'

export interface LevelGroupSectionProps {
  level: number
  count: number
  drivers: number
  passengers: number
  children: ReactNode
  className?: string
}

export const LevelGroupSection: FC<LevelGroupSectionProps> = ({
  level,
  count,
  drivers,
  passengers,
  children,
  className = '',
}) => {
  const parts: string[] = [`${count} membro${count !== 1 ? 's' : ''}`]
  if (drivers > 0) parts.push(`${drivers} motorista${drivers !== 1 ? 's' : ''}`)
  if (passengers > 0) parts.push(`${passengers} passageiro${passengers !== 1 ? 's' : ''}`)

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Centered pill header with glow flanks */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-[#F28C28]/20" />
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#F28C28]/15 bg-[#1A0E04] px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F28C28]/70">
            Nível {level}
          </span>
          <span className="text-[#3D2B10]">·</span>
          <span className="text-[10px] text-[#5A3F22]">{parts.join(' · ')}</span>
        </div>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-[#F28C28]/20" />
      </div>

      {children}
    </div>
  )
}

export default LevelGroupSection
