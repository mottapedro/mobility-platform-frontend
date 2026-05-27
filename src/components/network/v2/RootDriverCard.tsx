'use client'

import type { FC } from 'react'
import type { RootDriverContext } from '@/types/network-v2'
import { Card, Avatar, Badge } from '@/design-system'

export interface RootDriverCardProps {
  rootDriver: RootDriverContext
  className?: string
  /** Optional CTA, e.g. "Pedir corrida". Renders nothing when omitted. */
  cta?: React.ReactNode
}

/**
 * ALIADO Nacional V2 — passenger-facing presentation of the operational
 * root driver. Pure renderer of `RootDriverContext` (backend-governed).
 */
export const RootDriverCard: FC<RootDriverCardProps> = ({
  rootDriver,
  className = '',
  cta,
}) => {
  const fallback = rootDriver.name?.[0]?.toUpperCase() ?? '?'
  return (
    <Card glow className={className}>
      <div
        data-testid="root-driver-card"
        className="flex items-center gap-4 p-4"
      >
        <Avatar size={64} fallback={fallback} highlight alt={rootDriver.name} />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-aliado-text">
              {rootDriver.name}
            </span>
            {rootDriver.offersAssistedTransport && (
              <Badge variant="success">Acessível</Badge>
            )}
          </div>
          {rootDriver.vehicleSummary && (
            <span className="text-sm text-aliado-sub">
              {rootDriver.vehicleSummary}
            </span>
          )}
          <div className="flex items-center gap-3 text-xs text-aliado-muted">
            {rootDriver.region && <span>{rootDriver.region}</span>}
            {rootDriver.rating != null && (
              <span>★ {rootDriver.rating.toFixed(1)}</span>
            )}
          </div>
        </div>
        {cta && <div className="shrink-0">{cta}</div>}
      </div>
    </Card>
  )
}

export default RootDriverCard
