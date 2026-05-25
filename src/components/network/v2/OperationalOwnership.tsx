'use client'

import type { FC } from 'react'
import type { NetworkDriverActor } from '@/types/network-v2'
import { Card, EmptyState, SectionTitle } from '@/design-system'
import { RootDriverCard } from './RootDriverCard'
import type { RootDriverContext } from '@/types/network-v2'

export interface OperationalOwnershipProps {
  /** Backend-resolved operational owner. `null` when the actor is a driver
   *  (drivers do not have an operational owner) or when the passenger is
   *  awaiting allocation. */
  operationalOwner: NetworkDriverActor | null
  className?: string
}

const driverToRootContext = (driver: NetworkDriverActor): RootDriverContext => {
  const vehicleParts = [driver.vehicle?.brand, driver.vehicle?.model]
    .filter(Boolean)
    .join(' ')
  const plate = driver.vehicle?.plate
  const vehicleSummary =
    vehicleParts && plate
      ? `${vehicleParts} • ${plate}`
      : vehicleParts || plate || null
  return {
    id: driver.id,
    name: driver.name,
    slug: driver.slug ?? null,
    region: driver.region ?? null,
    vehicleSummary,
    rating: driver.rating ?? null,
    offersAssistedTransport: driver.offersAssistedTransport ?? false,
  }
}

/**
 * ALIADO Nacional V2 — operational ownership view.
 * Renders the driver who operationally owns this actor's rides
 * (passenger context only). Backend governs ownership; FE only renders.
 */
export const OperationalOwnership: FC<OperationalOwnershipProps> = ({
  operationalOwner,
  className = '',
}) => (
  <section
    data-testid="operational-ownership"
    className={`flex flex-col gap-3 ${className}`}
  >
    <SectionTitle>Motorista responsável</SectionTitle>
    {operationalOwner ? (
      <RootDriverCard rootDriver={driverToRootContext(operationalOwner)} />
    ) : (
      <Card>
        <EmptyState
          title="Sem motorista operacional"
          description="Você ainda não foi alocado a um motorista da rede."
        />
      </Card>
    )}
  </section>
)

export default OperationalOwnership
