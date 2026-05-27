'use client'

// ─── ALIADO Nacional V2 — Executive Node Card (dispatcher) ────────────────
// Routes rendering to the correct typed card based on actorType.
// DRIVER → DriverNodeCard (featured, tier-sized)
// PASSENGER → PassengerNodeCard (compact, muted)
// ─────────────────────────────────────────────────────────────────────────
import type { FC } from 'react'
import type { ExecutiveGenealogyNode } from '@/types/network-v2'
import { DriverNodeCard } from './DriverNodeCard'
import { PassengerNodeCard } from './PassengerNodeCard'

export interface ExecutiveNodeCardProps {
  node: ExecutiveGenealogyNode
  className?: string
}

export const ExecutiveNodeCard: FC<ExecutiveNodeCardProps> = ({ node, className }) => {
  if (node.actorType === 'PASSENGER') {
    return <PassengerNodeCard node={node} className={className} />
  }
  return <DriverNodeCard node={node} className={className} />
}

export default ExecutiveNodeCard
