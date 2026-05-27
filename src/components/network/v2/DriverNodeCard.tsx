'use client'

// ─── ALIADO Nacional V2 — Driver Node Card ────────────────────────────────
// Specialized card for DRIVER-type nodes in the executive network tree.
// Tier-differentiated sizing: root (featured), leader, operator.
// MUST preserve data-testid="projection-node-row" and data-tier={node.tier}.
// ─────────────────────────────────────────────────────────────────────────
import { useState, type FC } from 'react'
import type { ExecutiveGenealogyNode, InfluenceTier } from '@/types/network-v2'
import { Avatar } from '@/design-system'
import { NetworkInfluenceBadge } from './NetworkInfluenceBadge'
import { NodeMetricsPanel } from './NodeMetricsPanel'
import { NETWORK_DRIVER_GLOW, NETWORK_DRIVER_TIER_CARD_STYLES } from './styles'

// ─── Avatar sizes ─────────────────────────────────────────────────────────

const AVATAR_SIZE: Record<string, number> = {
  root:     56,
  leader:   44,
  operator: 36,
  client:   32,
}

function resolveGlow(node: ExecutiveGenealogyNode): string {
  if (node.tier === 'root') return NETWORK_DRIVER_GLOW.root
  if (node.influenceTier === 'ELITE') return NETWORK_DRIVER_GLOW.elite
  if (node.influenceTier === ('HUB' as InfluenceTier) || node.isHub) return NETWORK_DRIVER_GLOW.hub
  return ''
}

function getSubline(node: ExecutiveGenealogyNode): string {
  if (node.tier === 'root')     return 'Raiz da rede'
  if (node.tier === 'leader')   return `Líder · Nível ${node.level}`
  return `Operador · Nível ${node.level}`
}

// ─── Component ────────────────────────────────────────────────────────────

export interface DriverNodeCardProps {
  node: ExecutiveGenealogyNode
  className?: string
}

export const DriverNodeCard: FC<DriverNodeCardProps> = ({ node, className = '' }) => {
  const [expanded, setExpanded] = useState(false)

  const initial = (node.name?.[0] ?? '?').toUpperCase()
  const avatarSize = AVATAR_SIZE[node.tier] ?? 36
  const { wrapper, nameSize } = NETWORK_DRIVER_TIER_CARD_STYLES[node.tier] ?? NETWORK_DRIVER_TIER_CARD_STYLES.operator
  const glow = resolveGlow(node)
  const isRoot = node.tier === 'root'

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        data-testid="projection-node-row"
        data-tier={node.tier}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(v => !v)
        }}
        className={[
          'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3',
          'hover:border-aliado-orange/40 transition-all duration-150',
          wrapper,
          glow,
          className,
        ].join(' ')}
      >
        {/* Avatar + hub overlay */}
        <div className="relative shrink-0">
          <Avatar size={avatarSize} fallback={initial} alt={node.name} />
          {node.isHub && !isRoot && (
            <span className="absolute -bottom-1 -right-1 rounded-full border border-aliado-card-sub bg-aliado-success px-1 text-[8px] font-bold leading-4 text-white">
              HUB
            </span>
          )}
        </div>

        {/* Name + sub-labels */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`truncate font-semibold text-aliado-text ${nameSize}`}>
            {node.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-aliado-orange/60">
              MOTORISTA
            </span>
            <span className="text-[10px] text-aliado-muted">· {getSubline(node)}</span>
          </div>
        </div>

        {/* Influence badge */}
        <NetworkInfluenceBadge tier={node.influenceTier} />

        {/* Expand chevron */}
        <span
          aria-hidden="true"
          className={`text-xs text-aliado-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </div>

      {/* Metrics panel */}
      {expanded && <NodeMetricsPanel node={node} />}
    </div>
  )
}

export default DriverNodeCard
