'use client'

import type { FC } from 'react'
import type { Genealogy, GenealogyNode, NetworkActor } from '@/types/network-v2'
import { Avatar, Badge, Card, EmptyState, SectionTitle } from '@/design-system'
import { LevelGroupSection } from './LevelGroupSection'

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
        <span className="truncate text-sm font-semibold text-[#F5ECD8]">
          {actor.name}
        </span>
        <span className="text-xs text-[#9A7D5A]">
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
    <div className="flex items-center gap-3 rounded-xl border border-[#F28C28]/20 bg-[#1A0E04] px-3 py-2 my-1">
      <Avatar size={36} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-[#F5ECD8]">{actor.name}</span>
        <span className="text-xs text-[#9A7D5A]">
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
        'flex items-center gap-3 rounded-xl border px-3 py-2',
        isDriver
          ? 'border-[#2E1A08] bg-[#0F0903]'
          : 'border-[#1E1208] bg-[#0B0600]',
      ].join(' ')}
    >
      <Avatar size={isDriver ? 36 : 30} fallback={fallback} alt={actor.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-sm font-medium ${isDriver ? 'text-[#F5ECD8]' : 'text-[#C8A87A]'}`}>
          {actor.name}
        </span>
        <span className="text-xs text-[#9A7D5A]">
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
              <div className="absolute left-4.5 top-8 bottom-13 w-0.5 bg-[#2E1A08]" />
              {ancestors.map((actor, idx) => (
                <ActorRow
                  key={actor.id}
                  actor={actor}
                  tag={idx === 0 ? 'convidou você' : `+${idx}`}
                />
              ))}
              <div className="border-t border-[#2E1A08] mb-1" />
            </div>
          ) : (
            <p className="py-3 text-xs text-[#5A3F22]">
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
