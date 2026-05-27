'use client'

// ─── ALIADO Nacional V2 — Level Group Section ─────────────────────────────
// Decorative header that separates nodes by their depth level.
// Used by ProjectionTree (level view) and GenealogySocial (descendants).
// ─────────────────────────────────────────────────────────────────────────
import type { FC, ReactNode } from 'react'
import { NETWORK_LEVEL_GROUP } from './styles'

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
        <div className={NETWORK_LEVEL_GROUP.flankLeft} />
        <div className={NETWORK_LEVEL_GROUP.pill}>
          <span className={NETWORK_LEVEL_GROUP.title}>
            Nível {level}
          </span>
          <span className={NETWORK_LEVEL_GROUP.divider}>·</span>
          <span className={NETWORK_LEVEL_GROUP.meta}>{parts.join(' · ')}</span>
        </div>
        <div className={NETWORK_LEVEL_GROUP.flankRight} />
      </div>

      {children}
    </div>
  )
}

export default LevelGroupSection
