'use client'

// ─── ALIADO Nacional V2 — Network Influence Badge ─────────────────────────
// Visual badge encoding the influence tier of an executive node.
// Used by ExecutiveNodeCard. All variants use the existing Badge design token.
// ─────────────────────────────────────────────────────────────────────────
import type { FC } from 'react'
import type { InfluenceTier } from '@/types/network-v2'
import { Badge } from '@/design-system'

export interface NetworkInfluenceBadgeProps {
  tier: InfluenceTier
  /** Optional extra className on the wrapper span (e.g. glow ring). */
  className?: string
}

interface BadgeConfig {
  label: string
  variant: 'orange' | 'success' | 'danger' | 'muted'
}

const BADGE_CONFIG: Record<InfluenceTier, BadgeConfig> = {
  ROOT:        { label: 'ROOT',    variant: 'orange' },
  ELITE:       { label: 'ELITE',   variant: 'orange' },
  HUB:         { label: 'HUB',     variant: 'success' },
  EXPANSION:   { label: 'LÍDER',   variant: 'orange' },
  OPERATIONAL: { label: 'OP',      variant: 'orange' },
  BEGINNER:    { label: 'NOVO',    variant: 'muted' },
  CLIENT:      { label: 'CLIENTE', variant: 'muted' },
}

export const NetworkInfluenceBadge: FC<NetworkInfluenceBadgeProps> = ({
  tier,
  className = '',
}) => {
  const { label, variant } = BADGE_CONFIG[tier]
  return (
    <span className={className}>
      <Badge variant={variant}>{label}</Badge>
    </span>
  )
}

export default NetworkInfluenceBadge
