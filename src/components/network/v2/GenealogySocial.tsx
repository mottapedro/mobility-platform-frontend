'use client'

import type { FC } from 'react'
import type { Genealogy, GenealogyNode, NetworkActor } from '@/types/network-v2'
import { Avatar, Badge, Card, EmptyState, SectionTitle } from '@/design-system'
import { LevelGroupSection } from './LevelGroupSection'
import { NETWORK_SOCIAL } from './styles'

export interface GenealogySocialProps {
  genealogy: Genealogy
  className?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────

function flatDescendantsByLevel(nodes: GenealogyNode[]): Map<number, GenealogyNode[]> {
  const map = new Map<number, GenealogyNode[]>()
  function traverse(n: GenealogyNode) {
    if (!map.has(n.depth)) map.set(n.depth, [])
    map.get(n.depth)!.push(n)
    n.children.forEach(traverse)
  }
  nodes.forEach(traverse)
  return map
}

// ─── Sub-components ───────────────────────────────────────────────────────

const ActorRow: FC<{ actor: NetworkActor; tag?: string }> = ({ actor, tag }) => {
  const fallback = actor.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar size={36} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={NETWORK_SOCIAL.actorName}>
          {actor.name}
        </span>
        <span className={NETWORK_SOCIAL.actorMeta}>
          {actor.actorType === 'driver' ? 'Motorista' : 'Passageiro'}
          {actor.region ? ` · ${actor.region}` : ''}
        </span>
      </div>
      {tag && <Badge variant="muted">{tag}</Badge>}
    </div>
  )
}

/** "Me" row — highlighted with soft orange border */
const MeRow: FC<{ actor: NetworkActor }> = ({ actor }) => {
  const fallback = actor.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className={NETWORK_SOCIAL.meRow}>
      <Avatar size={36} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={NETWORK_SOCIAL.actorName}>{actor.name}</span>
        <span className={NETWORK_SOCIAL.actorMeta}>
          {actor.actorType === 'driver' ? 'Motorista' : 'Passageiro'}
          {actor.region ? ` · ${actor.region}` : ''}
        </span>
      </div>
      <Badge variant="muted">você</Badge>
    </div>
  )
}

/** Flat row for a single descendant node */
const DescendantRow: FC<{ node: GenealogyNode }> = ({ node }) => {
  const { actor } = node
  const isDriver = actor.actorType === 'driver'
  const fallback = actor.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className={[
        'flex items-center gap-3 px-3 py-2',
        isDriver
          ? NETWORK_SOCIAL.driverRow
          : NETWORK_SOCIAL.passengerRow,
      ].join(' ')}
    >
      <Avatar size={isDriver ? 36 : 30} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={isDriver ? 'truncate text-sm font-medium text-aliado-text' : NETWORK_SOCIAL.passengerName}>
          {actor.name}
        </span>
        <span className={NETWORK_SOCIAL.actorMeta}>
          {isDriver ? 'Motorista' : 'Passageiro'}
          {actor.region ? ` · ${actor.region}` : ''}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

/**
 * ALIADO Nacional V2 — social genealogy:
 *  - Ancestors (path UP to the root) with chain visual
 *  - Me (highlighted)
 *  - Descendants grouped by level using LevelGroupSection
 *
 * Pure presentation. NO inference of relationships — backend governs.
 */
export const GenealogySocial: FC<GenealogySocialProps> = ({
  genealogy,
  className = '',
}) => {
  const { me, ancestors, descendants } = genealogy
  const hasAncestors  = ancestors.length > 0
  const hasDescendants = descendants.length > 0

  // Flatten descendants by depth level for grouped display
  const levelMap   = flatDescendantsByLevel(descendants)
  const levelKeys  = Array.from(levelMap.keys()).sort((a, b) => a - b)

  return (
    <div
      data-testid="genealogy-social"
      className={`flex flex-col gap-5 ${className}`}
    >
      {/* ── Linhagem social ──────────────────────────────────────────── */}
      <section>
        <SectionTitle>Linhagem social</SectionTitle>
        <Card className="mt-3 px-4 py-2">
          {hasAncestors ? (
            <div className="relative">
              {/* Vertical connecting line behind ancestor rows */}
              <div className={NETWORK_SOCIAL.lineageConnector} />
              {ancestors.map((actor, idx) => (
                <ActorRow
                  key={actor.id}
                  actor={actor}
                  tag={idx === 0 ? 'convidou você' : `+${idx}`}
                />
              ))}
              <div className={NETWORK_SOCIAL.lineageDivider} />
            </div>
          ) : (
            <p className={NETWORK_SOCIAL.topHint}>
              Você está no topo da sua linhagem.
            </p>
          )}
          <MeRow actor={me} />
        </Card>
      </section>

      {/* ── Descendentes (level-grouped) ─────────────────────────────── */}
      <section>
        <SectionTitle>Descendentes</SectionTitle>
        {hasDescendants ? (
          <div className="mt-3 flex flex-col gap-5">
            {levelKeys.map(level => {
              const nodesAtLevel = levelMap.get(level)!
              const drivers    = nodesAtLevel.filter(n => n.actor.actorType === 'driver').length
              const passengers = nodesAtLevel.filter(n => n.actor.actorType === 'passenger').length
              return (
                <LevelGroupSection
                  key={level}
                  level={level}
                  count={nodesAtLevel.length}
                  drivers={drivers}
                  passengers={passengers}
                >
                  <div className="flex flex-col gap-2">
                    {nodesAtLevel.map(node => (
                      <DescendantRow key={node.actor.id} node={node} />
                    ))}
                  </div>
                </LevelGroupSection>
              )
            })}
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            title="Sua rede começa agora"
            description="Convide motoristas ou passageiros para crescer sua linhagem."
          />
        )}
      </section>
    </div>
  )
}

export default GenealogySocial
