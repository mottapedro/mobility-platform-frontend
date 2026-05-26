'use client'

// ─── ALIADO Nacional V2 — Executive Network Tree ──────────────────────────
// Renders the genealogy projection as a real hierarchical tree.
// Parent-child relationships reconstructed from node.parentId.
// Hub detection from projection.edges[]. Tier system from node.level + actorType.
// Pure presentation — all data comes from BuildGenealogyProjectionService.
// ───────────────────────────────────────────────────────────────────────────
import type { FC } from 'react'
import type {
  GenealogyProjection,
  GenealogyProjectionNode,
  GenealogyProjectionEdge,
} from '@/types/network-v2'
import { Avatar, Badge, EmptyState } from '@/design-system'

export interface ProjectionTreeProps {
  projection: GenealogyProjection
  className?: string
}

// ─── Tier ─────────────────────────────────────────────────────────────────

type NodeTier = 'root' | 'leader' | 'operator' | 'client'

function getTier(node: GenealogyProjectionNode): NodeTier {
  if (node.level === 0) return 'root'
  if (node.actorType === 'PASSENGER') return 'client'
  if (node.level === 1) return 'leader'
  return 'operator'
}

interface TierConfig {
  avatarSize: number
  badgeVariant: 'orange' | 'success' | 'danger' | 'muted'
  badgeLabel: string
  getLabel: (level: number) => string
  cardClass: string
}

const TIER_CONFIG: Record<NodeTier, TierConfig> = {
  root: {
    avatarSize: 48,
    badgeVariant: 'orange',
    badgeLabel: 'ROOT',
    getLabel: () => 'Raiz da rede',
    cardClass: 'border-[#F28C28]/40 bg-[#1A0E04]',
  },
  leader: {
    avatarSize: 40,
    badgeVariant: 'orange',
    badgeLabel: 'LÍDER',
    getLabel: (level) => `Líder Nível ${level}`,
    cardClass: 'border-[#2E1A08] bg-[#0F0903]',
  },
  operator: {
    avatarSize: 32,
    badgeVariant: 'orange',
    badgeLabel: 'OP',
    getLabel: (level) => `Operador Nível ${level}`,
    cardClass: 'border-[#2E1A08] bg-[#0F0903]',
  },
  client: {
    avatarSize: 28,
    badgeVariant: 'muted',
    badgeLabel: 'CLIENTE',
    getLabel: () => 'Carteira',
    cardClass: 'border-[#2E1A08] bg-[#0F0903]',
  },
}

// ─── Tree construction ────────────────────────────────────────────────────

function buildChildrenMap(
  nodes: GenealogyProjectionNode[],
): Map<string | null, GenealogyProjectionNode[]> {
  const map = new Map<string | null, GenealogyProjectionNode[]>()
  for (const node of nodes) {
    const key = node.parentId
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(node)
  }
  return map
}

function buildHubSet(
  edges: GenealogyProjectionEdge[],
  nodes: GenealogyProjectionNode[],
): Set<string> {
  const childCount = new Map<string, number>()
  for (const edge of edges) {
    childCount.set(edge.sourceActorId, (childCount.get(edge.sourceActorId) ?? 0) + 1)
  }
  const hubs = new Set<string>()
  for (const node of nodes) {
    if (node.actorType === 'DRIVER' && (childCount.get(node.actorId) ?? 0) >= 3) {
      hubs.add(node.actorId)
    }
  }
  return hubs
}

// ─── helpers ──────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// ─── MetricPill ───────────────────────────────────────────────────────────

const MetricPill: FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col items-center rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-3 py-2 text-center">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9A7D5A]">
      {label}
    </span>
    <span className="mt-0.5 text-lg font-bold text-[#F5ECD8]">{value}</span>
  </div>
)

// ─── ExecutiveNodeCard ────────────────────────────────────────────────────

const ExecutiveNodeCard: FC<{
  node: GenealogyProjectionNode
  isHub: boolean
}> = ({ node, isHub }) => {
  const tier = getTier(node)
  const config = TIER_CONFIG[tier]
  const initial = (node.name?.[0] ?? '?').toUpperCase()

  return (
    <div
      data-testid="projection-node-row"
      data-tier={tier}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${config.cardClass}`}
    >
      {/* Avatar with optional hub overlay */}
      <div className="relative shrink-0">
        <Avatar size={config.avatarSize} fallback={initial} alt={node.name} />
        {isHub && (
          <span className="absolute -bottom-1 -right-1 rounded-full border border-[#0F0903] bg-[#3DB87A] px-1 text-[8px] font-bold text-white leading-4">
            HUB
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-[#F5ECD8]">
          {node.name}
        </span>
        <span className="text-xs text-[#9A7D5A]">
          {config.getLabel(node.level)}
        </span>
      </div>

      {/* Tier badge */}
      <Badge variant={config.badgeVariant}>{config.badgeLabel}</Badge>
    </div>
  )
}

// ─── TreeNode (recursive) ─────────────────────────────────────────────────

const BRANCH_LINE_CLASSES = [
  'border-[#F28C28]/30', // depth 0 → level 1 children
  'border-[#F28C28]/15', // depth 1 → level 2 children
  'border-[#2E1A08]',    // depth 2+ → deeper children
]

const TreeNode: FC<{
  node: GenealogyProjectionNode
  childrenMap: Map<string | null, GenealogyProjectionNode[]>
  hubSet: Set<string>
  depth: number
}> = ({ node, childrenMap, hubSet, depth }) => {
  const children = childrenMap.get(node.actorId) ?? []
  const lineClass = BRANCH_LINE_CLASSES[Math.min(depth, BRANCH_LINE_CLASSES.length - 1)]

  return (
    <div data-testid={`tree-node-depth-${depth}`}>
      <ExecutiveNodeCard node={node} isHub={hubSet.has(node.actorId)} />
      {children.length > 0 && (
        <div className={`mt-1.5 ml-5 border-l-2 pl-3 ${lineClass}`}>
          {children.map(child => (
            <div key={child.actorId} className="mt-2">
              <TreeNode
                node={child}
                childrenMap={childrenMap}
                hubSet={hubSet}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

/**
 * ALIADO Nacional V2 — Executive Network Tree.
 *
 * Renders the genealogy projection as a real hierarchical tree using
 * parent-child relationships from node.parentId. Tier system (root/leader/
 * operator/client) and hub detection are derived client-side from existing
 * projection data — no backend changes required.
 *
 * Props:
 *  - `projection` — GenealogyProjection from fetchGenealogyProjection()
 *  - `className`  — optional wrapper class
 */
export const ProjectionTree: FC<ProjectionTreeProps> = ({
  projection,
  className = '',
}) => {
  const { nodes, edges, metrics } = projection

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

  const childrenMap = buildChildrenMap(nodes)
  const hubSet = buildHubSet(edges, nodes)
  // Root nodes: parentId === null. Fallback to level=0 nodes if none found.
  const roots = childrenMap.get(null) ?? nodes.filter(n => n.level === 0)

  return (
    <div
      data-testid="projection-tree"
      className={`flex flex-col gap-5 ${className}`}
    >
      {/* Metrics strip — 6 pills */}
      <div
        data-testid="projection-metrics"
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
      >
        <MetricPill label="Rede total" value={formatNumber(metrics.totalDrivers + metrics.totalPassengers)} />
        <MetricPill label="Alcance" value={formatNumber(metrics.maxDepth)} />
        <MetricPill label="Operadores" value={formatNumber(metrics.totalDrivers)} />
        <MetricPill label="Carteira" value={formatNumber(metrics.totalPassengers)} />
        <MetricPill label="D2D" value={formatNumber(metrics.totalD2D)} />
        <MetricPill label="D2P" value={formatNumber(metrics.totalD2P)} />
      </div>

      {/* Hierarchical tree */}
      <div className="flex flex-col gap-2">
        {roots.map(root => (
          <TreeNode
            key={root.actorId}
            node={root}
            childrenMap={childrenMap}
            hubSet={hubSet}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectionTree
