'use client'

import type { FC } from 'react'
import type { Genealogy, GenealogyNode, NetworkActor } from '@/types/network-v2'
import { Avatar, Badge, Card, EmptyState, SectionTitle } from '@/design-system'

export interface GenealogySocialProps {
  genealogy: Genealogy
  className?: string
}

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

const DescendantTree: FC<{ nodes: GenealogyNode[] }> = ({ nodes }) => (
  <ul className="space-y-2">
    {nodes.map(node => (
      <li key={node.actor.id}>
        <div
          className="rounded-[14px] border border-[#2E1A08] bg-[#0F0903] px-3"
          style={{ marginLeft: Math.min(node.depth, 4) * 12 }}
        >
          <ActorRow actor={node.actor} tag={`nível ${node.depth}`} />
        </div>
        {node.children.length > 0 && (
          <div className="mt-2">
            <DescendantTree nodes={node.children} />
          </div>
        )}
      </li>
    ))}
  </ul>
)

/**
 * ALIADO Nacional V2 — social genealogy:
 *  - Ancestors (path UP to the root)
 *  - Me
 *  - Descendants (recursive tree DOWN)
 *
 * Pure presentation. NO inference of relationships — backend governs.
 */
export const GenealogySocial: FC<GenealogySocialProps> = ({
  genealogy,
  className = '',
}) => {
  const { me, ancestors, descendants } = genealogy
  const hasAncestors = ancestors.length > 0
  const hasDescendants = descendants.length > 0

  return (
    <div
      data-testid="genealogy-social"
      className={`flex flex-col gap-5 ${className}`}
    >
      <section>
        <SectionTitle>Linhagem social</SectionTitle>
        <Card className="mt-3 px-4 py-2">
          {hasAncestors ? (
            <>
              {ancestors.map((actor, idx) => (
                <ActorRow
                  key={actor.id}
                  actor={actor}
                  tag={idx === 0 ? 'convidou você' : `+${idx}`}
                />
              ))}
              <div className="border-t border-[#2E1A08]" />
            </>
          ) : (
            <p className="py-3 text-xs text-[#5A3F22]">
              Você está no topo da sua linhagem.
            </p>
          )}
          <ActorRow actor={me} tag="você" />
        </Card>
      </section>

      <section>
        <SectionTitle>Descendentes</SectionTitle>
        {hasDescendants ? (
          <div className="mt-3">
            <DescendantTree nodes={descendants} />
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
