'use client'

import type { FC } from 'react'
import type { NetworkActor } from '@/types/network-v2'
import { Avatar, Card, EmptyState, SectionTitle } from '@/design-system'

export interface LateralNetworkProps {
  lateral: NetworkActor[]
  className?: string
}

/**
 * ALIADO Nacional V2 — lateral / sibling actors view.
 * Renders peers sitting under the same parent in the genealogy.
 */
export const LateralNetwork: FC<LateralNetworkProps> = ({
  lateral,
  className = '',
}) => {
  const hasLateral = lateral.length > 0
  return (
    <section
      data-testid="lateral-network"
      className={`flex flex-col gap-3 ${className}`}
    >
      <SectionTitle>Rede lateral</SectionTitle>
      {hasLateral ? (
        <Card className="divide-y divide-[#2E1A08] px-4">
          {lateral.map(actor => {
            const fallback = actor.name?.[0]?.toUpperCase() ?? '?'
            return (
              <div
                key={actor.id}
                className="flex items-center gap-3 py-3"
                data-testid="lateral-actor"
              >
                <Avatar size={36} fallback={fallback} alt={actor.name} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[#F5ECD8]">
                    {actor.name}
                  </span>
                  <span className="text-xs text-[#9A7D5A]">
                    {actor.actorType === 'driver' ? 'Motorista' : 'Passageiro'}
                    {actor.region ? ` · ${actor.region}` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </Card>
      ) : (
        <EmptyState
          title="Nenhum par lateral"
          description="Você é o único nesta posição da rede."
        />
      )}
    </section>
  )
}

export default LateralNetwork
