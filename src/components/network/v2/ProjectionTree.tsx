'use client'

// ─── ALIADO Nacional V2 — Genealogy projection renderer ──────────────────
// Renders the flat BFS projection returned by BuildGenealogyProjectionService.
// Nodes are grouped by `levels` (depth 0, 1, 2 …) and displayed as indented
// rows. Pure presentation — all data comes from the backend via
// fetchGenealogyProjection; no inference happens here.
// ───────────────────────────────────────────────────────────────────────────
import type { FC } from 'react'
import type {
  GenealogyProjection,
  GenealogyProjectionNode,
} from '@/types/network-v2'
import { Avatar, Badge, SectionTitle, EmptyState } from '@/design-system'

export interface ProjectionTreeProps {
  projection: GenealogyProjection
  className?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// ─── Sub-components ───────────────────────────────────────────────────────

const MetricPill: FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col items-center rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-2 text-center">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9A7D5A]">
      {label}
    </span>
    <span className="mt-0.5 text-xl font-bold text-[#F5ECD8]">{value}</span>
  </div>
)

const NodeRow: FC<{ node: GenealogyProjectionNode }> = ({ node }) => {
  const isDriver = node.actorType === 'DRIVER'
  const initial = (node.name?.[0] ?? '?').toUpperCase()
  // indent depth-0 nodes flush; deeper nodes get 12px per level
  const indent = Math.min(node.level, 5) * 12

  return (
    <div
      data-testid="projection-node-row"
      className="flex items-center gap-3 py-2"
      style={{ paddingLeft: indent }}
    >
      <Avatar size={32} fallback={initial} alt={node.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-[#F5ECD8]">
          {node.name}
        </span>
        <span className="text-xs text-[#9A7D5A]">
          {isDriver ? 'Motorista' : 'Passageiro'} · nível {node.level}
        </span>
      </div>
      <Badge variant={isDriver ? 'orange' : 'muted'}>
        {isDriver ? 'D' : 'P'}
      </Badge>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

/**
 * ALIADO Nacional V2 — flat BFS projection tree.
 *
 * Renders nodes grouped by depth level. Each level shows its nodes as
 * indented rows. Metrics strip at top summarises the projection.
 *
 * Props:
 *  - `projection` — GenealogyProjection from fetchGenealogyProjection()
 *  - `className`  — optional wrapper class
 */
export const ProjectionTree: FC<ProjectionTreeProps> = ({
  projection,
  className = '',
}) => {
  const { nodes, levels, metrics } = projection

  if (nodes.length === 0) {
    return (
      <div data-testid="projection-tree" className={className}>
        <EmptyState
          title="Rede ainda sem membros"
          description="Convide motoristas ou passageiros para iniciar sua árvore genealógica."
        />
      </div>
    )
  }

  // Build a lookup map so level rendering is O(1) per node
  const nodeMap = new Map<string, GenealogyProjectionNode>(
    nodes.map(n => [n.actorId, n]),
  )

  // Sort levels by depth ascending
  const sortedLevels = [...levels].sort((a, b) => a.depth - b.depth)

  return (
    <div
      data-testid="projection-tree"
      className={`flex flex-col gap-5 ${className}`}
    >
      {/* Metrics strip */}
      <div
        data-testid="projection-metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <MetricPill label="Total" value={formatNumber(metrics.totalDrivers + metrics.totalPassengers)} />
        <MetricPill label="Profundidade" value={formatNumber(metrics.maxDepth)} />
        <MetricPill label="Motoristas" value={formatNumber(metrics.totalDrivers)} />
        <MetricPill label="Passageiros" value={formatNumber(metrics.totalPassengers)} />
      </div>

      {/* Levels */}
      {sortedLevels.map(level => {
        const levelNodes = level.nodeIds
          .map(id => nodeMap.get(id))
          .filter((n): n is GenealogyProjectionNode => n !== undefined)

        if (levelNodes.length === 0) return null

        const depthLabel =
          level.depth === 0
            ? 'Raiz'
            : `Nível ${level.depth}`

        return (
          <section key={level.depth}>
            <SectionTitle>
              <span data-testid={`level-header-${level.depth}`}>
                {depthLabel} · {levelNodes.length}{' '}
                {levelNodes.length === 1 ? 'membro' : 'membros'}
              </span>
            </SectionTitle>
            <div className="mt-3 rounded-2xl border border-[#2E1A08] bg-[#0F0903] px-4">
              {levelNodes.map(node => (
                <NodeRow key={node.actorId} node={node} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default ProjectionTree
