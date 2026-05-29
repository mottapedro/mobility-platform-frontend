'use client'

import type { FC } from 'react'
import type { NetworkActor } from '@/types/network-v2'
import { Avatar, EmptyState, SectionTitle } from '@/design-system'
import { ClusterGroup } from './ClusterGroup'
import { NETWORK_LATERAL } from './styles'

export interface LateralNetworkProps {
  lateral: NetworkActor[]
  className?: string
}

// ─── Actor row ────────────────────────────────────────────────────────────

const LateralActorRow: FC<{ actor: NetworkActor; isDriver: boolean }> = ({
  actor,
  isDriver,
}) => {
  const fallback = actor.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      data-testid="lateral-actor"
      className={[
        'flex items-center gap-3 px-3 py-2',
        isDriver
          ? NETWORK_LATERAL.driverRow
          : NETWORK_LATERAL.passengerRow,
      ].join(' ')}
    >
      <Avatar size={isDriver ? 36 : 30} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={isDriver ? NETWORK_LATERAL.driverName : NETWORK_LATERAL.passengerName}>
          {actor.name}
        </span>
        <span className={NETWORK_LATERAL.meta}>
          {isDriver ? 'Motorista' : 'Passageiro'}
          {actor.region ? ` · ${actor.region}` : ''}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

/**
 * ALIADO Nacional V2 — lateral / sibling actors view.
 * Groups peers by actor type using ClusterGroup containers.
 */
export const LateralNetwork: FC<LateralNetworkProps> = ({
  lateral,
  className = '',
}) => {
  const driverLateral    = lateral.filter(a => a.actorType === 'driver')
  const passengerLateral = lateral.filter(a => a.actorType === 'passenger')
  const hasLateral       = lateral.length > 0

  return (
    <section
      data-testid="lateral-network"
      className={`flex flex-col gap-4 ${className}`}
    >
      <SectionTitle>Rede lateral</SectionTitle>

      {hasLateral ? (
        <div className="flex flex-col gap-5">
          {driverLateral.length > 0 && (
            <ClusterGroup
              variant="driver"
              count={driverLateral.length}
              label="MOTORISTAS LATERAIS"
            >
              <div className="flex flex-col gap-2">
                {driverLateral.map(actor => (
                  <LateralActorRow key={actor.id} actor={actor} isDriver />
                ))}
              </div>
            </ClusterGroup>
          )}

          {passengerLateral.length > 0 && (
            <ClusterGroup
              variant="passenger"
              count={passengerLateral.length}
              label="PASSAGEIROS LATERAIS"
            >
              <div className="flex flex-col gap-2">
                {passengerLateral.map(actor => (
                  <LateralActorRow key={actor.id} actor={actor} isDriver={false} />
                ))}
              </div>
            </ClusterGroup>
          )}
        </div>
      ) : (
        <EmptyState
          title="Seu núcleo lateral ainda não abriu"
          description="Convide novos aliados no mesmo nível para desbloquear colaboração lateral, cobertura territorial e mais resiliência operacional da sua rede."
        />
      )}
    </section>
  )
}

export default LateralNetwork
