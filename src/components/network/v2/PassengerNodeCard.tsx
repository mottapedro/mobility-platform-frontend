'use client'

// ─── ALIADO Nacional V2 — Passenger Node Card ─────────────────────────────
// Compact card for PASSENGER-type nodes in the executive network tree.
// Muted, smaller treatment to visually subordinate passengers to drivers.
// MUST preserve data-testid="projection-node-row" and data-tier={node.tier}.
// ─────────────────────────────────────────────────────────────────────────
import { useState, type FC } from 'react'
import type { ExecutiveGenealogyNode } from '@/types/network-v2'
import { Avatar } from '@/design-system'
import { NetworkInfluenceBadge } from './NetworkInfluenceBadge'
import { NodeMetricsPanel } from './NodeMetricsPanel'
import { NETWORK_PASSENGER_NODE } from './styles'

// ─── Component ────────────────────────────────────────────────────────────

export interface PassengerNodeCardProps {
  node: ExecutiveGenealogyNode
  className?: string
}

export const PassengerNodeCard: FC<PassengerNodeCardProps> = ({
  node,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false)

  const hasChildren = node.children.length > 0
  const initial = (node.name?.[0] ?? '?').toUpperCase()
  const isInteractive = hasChildren

  return (
    <div>
      <div
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        data-testid="projection-node-row"
        data-tier={node.tier}
        onClick={() => isInteractive && setExpanded(v => !v)}
        onKeyDown={e => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) setExpanded(v => !v)
        }}
        className={[
          NETWORK_PASSENGER_NODE.wrapper,
          isInteractive
            ? NETWORK_PASSENGER_NODE.interactive
            : '',
          className,
        ].join(' ')}
      >
        {/* Avatar */}
        <Avatar size={32} fallback={initial} alt={node.name} />

        {/* Name + type label */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={NETWORK_PASSENGER_NODE.name}>{node.name}</span>
          <div className="flex items-center gap-1.5">
            <span className={NETWORK_PASSENGER_NODE.type}>
              PASSAGEIRO
            </span>
            <span className={NETWORK_PASSENGER_NODE.level}>· Nível {node.level}</span>
          </div>
        </div>

        {/* Influence badge */}
        <NetworkInfluenceBadge tier={node.influenceTier} />

        {/* Chevron — only when expandable */}
        {isInteractive && (
          <span
            aria-hidden="true"
            className={`${NETWORK_PASSENGER_NODE.chevron} ${expanded ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        )}
      </div>

      {/* Metrics panel */}
      {expanded && isInteractive && <NodeMetricsPanel node={node} />}
    </div>
  )
}

export default PassengerNodeCard
