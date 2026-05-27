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

// ─── Avatar sizes ─────────────────────────────────────────────────────────

const AVATAR_SIZE: Record<string, number> = {
  root:     56,
  leader:   44,
  operator: 36,
  client:   32,
}

// ─── Tier card styles ─────────────────────────────────────────────────────

const TIER_CARD: Record<string, { wrapper: string; nameSize: string }> = {
  root:     { wrapper: 'border-[#F28C28]/50 bg-[#1A0E04] min-h-[76px]', nameSize: 'text-base' },
  leader:   { wrapper: 'border-[#F28C28]/30 bg-[#120A03] min-h-[60px]', nameSize: 'text-sm' },
  operator: { wrapper: 'border-[#2E1A08]   bg-[#0F0903] min-h-[52px]', nameSize: 'text-sm' },
  client:   { wrapper: 'border-[#2E1A08]   bg-[#0F0903] min-h-12', nameSize: 'text-sm' },
}

const ROOT_GLOW = 'shadow-[0_0_20px_rgba(242,140,40,0.30)]'

function resolveGlow(node: ExecutiveGenealogyNode): string {
  if (node.tier === 'root') return ROOT_GLOW
  if (node.influenceTier === 'ELITE') return 'shadow-[0_0_14px_rgba(242,140,40,0.25)]'
  if (node.influenceTier === ('HUB' as InfluenceTier) || node.isHub) return 'shadow-[0_0_10px_rgba(61,184,122,0.20)]'
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
  const { wrapper, nameSize } = TIER_CARD[node.tier] ?? TIER_CARD.operator
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
          'hover:border-[#F28C28]/40 transition-all duration-150',
          wrapper,
          glow,
          className,
        ].join(' ')}
      >
        {/* Avatar + hub overlay */}
        <div className="relative shrink-0">
          <Avatar size={avatarSize} fallback={initial} alt={node.name} />
          {node.isHub && !isRoot && (
            <span className="absolute -bottom-1 -right-1 rounded-full border border-[#0F0903] bg-[#3DB87A] px-1 text-[8px] font-bold leading-4 text-white">
              HUB
            </span>
          )}
        </div>

        {/* Name + sub-labels */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`truncate font-semibold text-[#F5ECD8] ${nameSize}`}>
            {node.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#F28C28]/60">
              MOTORISTA
            </span>
            <span className="text-[10px] text-[#5A3F22]">· {getSubline(node)}</span>
          </div>
        </div>

        {/* Influence badge */}
        <NetworkInfluenceBadge tier={node.influenceTier} />

        {/* Expand chevron */}
        <span
          aria-hidden="true"
          className={`text-xs text-[#5A3F22] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
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
