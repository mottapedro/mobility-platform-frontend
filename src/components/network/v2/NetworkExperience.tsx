'use client'

import { useState, type FC } from 'react'
import type { NetworkContext, GenealogyProjection } from '@/types/network-v2'
import { NetworkMetricsBar } from './NetworkMetricsBar'
import { GenealogySocial } from './GenealogySocial'
import { OperationalOwnership } from './OperationalOwnership'
import { LateralNetwork } from './LateralNetwork'
import { RootDriverCard } from './RootDriverCard'
import { ProjectionTree } from './ProjectionTree'
import { useRootDriverContext } from '@/hooks/useRootDriverContext'

export type NetworkSection = 'social' | 'operational' | 'lateral' | 'tree'

export interface NetworkExperienceProps {
  context: NetworkContext
  /** Genealogy projection fetched by useGenealogyProjection. Driver flows only. */
  projection?: GenealogyProjection | null
  /** Initial active section. Defaults to "social". */
  initialSection?: NetworkSection
  className?: string
}

const SECTION_LABELS: Record<NetworkSection, string> = {
  social: 'Social',
  operational: 'Operacional',
  lateral: 'Lateral',
  tree: 'Árvore',
}

const TabButton: FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={[
      'rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
      active
        ? 'bg-[#F28C28] text-[#0D0700]'
        : 'bg-[#1A0E04] text-[#9A7D5A] border border-[#2E1A08]',
    ].join(' ')}
  >
    {children}
  </button>
)

/**
 * ALIADO Nacional V2 — top-level network orchestrator.
 *
 * Renders the appropriate sections for the given `NetworkContext`:
 *  - Metrics bar (always)
 *  - Root driver card (passenger flows only)
 *  - Tabs: Social / Operacional / Lateral
 *
 * Pure orchestration. Section visibility is driven by `flowType`; section
 * content is driven by the backend-resolved `genealogy`.
 */
export const NetworkExperience: FC<NetworkExperienceProps> = ({
  context,
  projection = null,
  initialSection = 'social',
  className = '',
}) => {
  const { flowType, genealogy, networkMetrics } = context
  const isPassengerFlow = context.targetActorExpected === 'passenger'
  const rootDriver = useRootDriverContext(context)
  const [active, setActive] = useState<NetworkSection>(initialSection)

  const sections: NetworkSection[] = isPassengerFlow
    ? ['social', 'operational', 'lateral']
    : ['social', 'tree', 'lateral']

  return (
    <div
      data-testid="network-experience"
      data-flow-type={flowType}
      className={`flex flex-col gap-5 ${className}`}
    >
      <NetworkMetricsBar metrics={networkMetrics} />

      {isPassengerFlow && rootDriver && (
        <RootDriverCard rootDriver={rootDriver} />
      )}

      <div role="tablist" className="flex flex-wrap gap-2">
        {sections.map(section => (
          <TabButton
            key={section}
            active={active === section}
            onClick={() => setActive(section)}
          >
            {SECTION_LABELS[section]}
          </TabButton>
        ))}
      </div>

      {active === 'social' && <GenealogySocial genealogy={genealogy} />}
      {active === 'operational' && isPassengerFlow && (
        <OperationalOwnership
          operationalOwner={genealogy.operationalOwner}
        />
      )}
      {active === 'tree' && !isPassengerFlow && (
        projection
          ? <ProjectionTree projection={projection} />
          : (
              <div
                data-testid="projection-loading"
                className="flex flex-col gap-4"
              >
                <div className="animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04] h-20" />
                <div className="animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04] h-40" />
              </div>
            )
      )}
      {active === 'lateral' && <LateralNetwork lateral={genealogy.lateral} />}
    </div>
  )
}

export default NetworkExperience
