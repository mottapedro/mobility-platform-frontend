'use client'

// ─── ALIADO Nacional V2 — Executive Network Tree ──────────────────────────
// Renders the genealogy projection as a recursive executive hierarchy.
// Uses buildExecutiveTree() to transform flat projection → ExecutiveGenealogyNode tree.
// Hub detection, tier classification, and influence scoring derived client-side.
// Pure presentation — all data comes from BuildGenealogyProjectionService.
// ───────────────────────────────────────────────────────────────────────────
import { useState, type FC } from 'react'
import type { GenealogyProjection, ExecutiveGenealogyNode } from '@/types/network-v2'
import { EmptyState } from '@/design-system'
import { buildExecutiveTree } from '@/utils/networkTree'
import { ExecutiveNodeCard } from './ExecutiveNodeCard'
import { ClusterGroup } from './ClusterGroup'
import { LevelGroupSection } from './LevelGroupSection'
import {
  NETWORK_BRANCH_BG_BY_TIER,
  NETWORK_BRANCH_LINE_BY_TIER,
  NETWORK_METRIC_PILL,
  NETWORK_TAB_BUTTON,
} from './styles'

export interface ProjectionTreeProps {
  projection: GenealogyProjection
  className?: string
}

// ─── View mode ────────────────────────────────────────────────────────────

type ViewMode = 'hierarchy' | 'level' | 'region'

const VIEW_LABELS: Record<ViewMode, string> = {
  hierarchy: 'Por Hierarquia',
  level:     'Por Nível',
  region:    'Por Região',
}

// ─── helpers ──────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function flattenByLevel(
  nodes: ExecutiveGenealogyNode[],
): Map<number, ExecutiveGenealogyNode[]> {
  const map = new Map<number, ExecutiveGenealogyNode[]>()
  function traverse(n: ExecutiveGenealogyNode) {
    if (!map.has(n.level)) map.set(n.level, [])
    map.get(n.level)!.push(n)
    n.children.forEach(traverse)
  }
  nodes.forEach(traverse)
  return map
}

function buildNodesById(nodes: ExecutiveGenealogyNode[]): Map<string, ExecutiveGenealogyNode> {
  const byId = new Map<string, ExecutiveGenealogyNode>()
  function walk(node: ExecutiveGenealogyNode) {
    byId.set(node.actorId, node)
    node.children.forEach(walk)
  }
  nodes.forEach(walk)
  return byId
}

// ─── MetricPill ───────────────────────────────────────────────────────────

const MetricPill: FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className={NETWORK_METRIC_PILL.wrapper}>
    <span className={NETWORK_METRIC_PILL.label}>
      {label}
    </span>
    <span className={NETWORK_METRIC_PILL.value}>{value}</span>
  </div>
)

// ─── Recursive tree node (hierarchy mode) ────────────────────────────────
// Uses function declarations so TreeNode and ClusteredChildren can reference each other.

function ClusteredChildren({
  node,
  depth,
}: {
  node: ExecutiveGenealogyNode
  depth: number
}) {
  const hubs       = node.children.filter(c => c.isHub)
  const drivers    = node.children.filter(c => !c.isHub && c.actorType === 'DRIVER')
  const passengers = node.children.filter(c => c.actorType === 'PASSENGER')

  return (
    <div className="ml-4 mt-4 flex flex-col gap-5">
      {hubs.length > 0 && (
        <ClusterGroup variant="hub" count={hubs.length}>
          <div className="flex flex-col gap-2.5">
            {hubs.map(c => (
              <TreeNode key={c.actorId} node={c} depth={depth + 1} />
            ))}
          </div>
        </ClusterGroup>
      )}
      {drivers.length > 0 && (
        <ClusterGroup variant="driver" count={drivers.length}>
          <div className="flex flex-col gap-2.5">
            {drivers.map(c => (
              <TreeNode key={c.actorId} node={c} depth={depth + 1} />
            ))}
          </div>
        </ClusterGroup>
      )}
      {passengers.length > 0 && (
        <ClusterGroup variant="passenger" count={passengers.length}>
          <div className="flex flex-col gap-2">
            {passengers.map(c => (
              <TreeNode key={c.actorId} node={c} depth={depth + 1} />
            ))}
          </div>
        </ClusterGroup>
      )}
    </div>
  )
}

function TreeNode({
  node,
  depth,
}: {
  node: ExecutiveGenealogyNode
  depth: number
}) {
  const lineClass = NETWORK_BRANCH_LINE_BY_TIER[node.influenceTier] ?? 'border-aliado-border'
  const bgClass = NETWORK_BRANCH_BG_BY_TIER[node.influenceTier] ?? 'bg-aliado-border'
  const isRoot    = node.tier === 'root'

  return (
    <div data-testid={`tree-node-depth-${depth}`}>
      <ExecutiveNodeCard node={node} />
      {node.children.length > 0 && (
        isRoot
          ? <ClusteredChildren node={node} depth={depth} />
          : (
              <div className={`ml-4 mt-2 border-l-2 pl-3 ${lineClass}`}>
                {node.children.map(child => (
                  <div key={child.actorId} className="relative mt-3">
                    <div className={`absolute -left-3 top-5.5 h-0.5 w-3 ${bgClass}`} />
                    <TreeNode node={child} depth={depth + 1} />
                  </div>
                ))}
              </div>
            )
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

export const ProjectionTree: FC<ProjectionTreeProps> = ({
  projection,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy')
  const { nodes, metrics } = projection

  if (nodes.length === 0) {
    return (
      <div data-testid="projection-tree" className={className}>
        <EmptyState
          title="Rede ainda sem membros"
          description="Convide motoristas ou passageiros para iniciar sua rede operacional."
        />
      </div>
    )
  }

  const executiveRoots = buildExecutiveTree(projection)
  const hasRegions = nodes.some(n => n.territory?.region)

  const levelModeRows =
    viewMode === 'level'
      ? (() => {
          const nodesById = buildNodesById(executiveRoots)

          // Prefer backend-provided level buckets and ordering to avoid
          // client-side re-grouping/re-ordering of the canonical projection.
          if (projection.levels.length > 0) {
            return projection.levels.map(({ depth, nodeIds }) => {
              const ns = nodeIds
                .map((id) => nodesById.get(id))
                .filter((node): node is ExecutiveGenealogyNode => !!node)
              return {
                level: depth,
                nodes: ns,
                drivers:    ns.filter(n => n.actorType === 'DRIVER').length,
                passengers: ns.filter(n => n.actorType === 'PASSENGER').length,
              }
            })
          }

          // Backward-compat fallback while backend levels are unavailable.
          const levelMap = flattenByLevel(executiveRoots)
          return Array.from(levelMap.keys()).map(level => {
              const ns = levelMap.get(level)!
              return {
                level,
                nodes: ns,
                drivers:    ns.filter(n => n.actorType === 'DRIVER').length,
                passengers: ns.filter(n => n.actorType === 'PASSENGER').length,
              }
            })
        })()
      : null

  const regionGroups: Map<string, ExecutiveGenealogyNode[]> | null =
    hasRegions && viewMode === 'region'
      ? executiveRoots.reduce((map, node) => {
          const region = node.territory?.region ?? 'Sem região'
          if (!map.has(region)) map.set(region, [])
          map.get(region)!.push(node)
          return map
        }, new Map<string, ExecutiveGenealogyNode[]>())
      : null

  const availableModes: ViewMode[] = hasRegions
    ? ['hierarchy', 'level', 'region']
    : ['hierarchy', 'level']

  return (
    <div
      data-testid="projection-tree"
      className={`flex flex-col gap-5 ${className}`}
    >
      <div
        data-testid="projection-metrics"
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
      >
        <MetricPill label="Rede total"  value={formatNumber(metrics.totalDrivers + metrics.totalPassengers)} />
        <MetricPill label="Alcance"     value={formatNumber(metrics.maxDepth)} />
        <MetricPill label="Operadores"  value={formatNumber(metrics.totalDrivers)} />
        <MetricPill label="Carteira"    value={formatNumber(metrics.totalPassengers)} />
        <MetricPill label="D2D"         value={formatNumber(metrics.totalD2D)} />
        <MetricPill label="D2P"         value={formatNumber(metrics.totalD2P)} />
      </div>

      <div className="flex gap-2">
        {availableModes.map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={[
              NETWORK_TAB_BUTTON.base,
              viewMode === mode
                ? NETWORK_TAB_BUTTON.active
                : NETWORK_TAB_BUTTON.idle,
            ].join(' ')}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>

      {viewMode === 'hierarchy' && (
        <div className="flex flex-col gap-2">
          {executiveRoots.map(root => (
            <TreeNode key={root.actorId} node={root} depth={0} />
          ))}
        </div>
      )}

      {viewMode === 'level' && levelModeRows && (
        <div className="flex flex-col gap-6">
          {levelModeRows.map(({ level, nodes: ns, drivers, passengers }) => (
            <LevelGroupSection
              key={level}
              level={level}
              count={ns.length}
              drivers={drivers}
              passengers={passengers}
            >
              <div className="flex flex-col gap-2">
                {ns.map(n => (
                  <ExecutiveNodeCard key={n.actorId} node={n} />
                ))}
              </div>
            </LevelGroupSection>
          ))}
        </div>
      )}

      {viewMode === 'region' && regionGroups && (
        <div className="flex flex-col gap-5">
          {Array.from(regionGroups.entries()).map(([region, regionRoots]) => (
            <div key={region} className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-aliado-sub">
                {region}
              </p>
              {regionRoots.map(root => (
                <TreeNode key={root.actorId} node={root} depth={0} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectionTree
