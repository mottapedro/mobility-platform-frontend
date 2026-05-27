import type { DriverNetworkNode } from '../types'
import type {
  GenealogyProjection,
  GenealogyProjectionEdge,
  GenealogyProjectionNode,
  ExecutiveGenealogyNode,
  InfluenceTier,
  NodeTier,
} from '../types/network-v2'

/**
 * Recursively walk the tree and cut any node that would create a cycle.
 * The backend should guarantee no cycles, but this is a defensive guard.
 */
export function sanitizeNetworkTree(
  node: DriverNetworkNode,
  visited = new Set<string>(),
): DriverNetworkNode {
  if (visited.has(node.id)) return { ...node, referrals: [] }
  visited.add(node.id)
  return {
    ...node,
    referrals: node.referrals.map((child) => sanitizeNetworkTree(child, new Set(visited))),
  }
}

/** Count total nodes in the tree (including root). */
export function countTreeNodes(node: DriverNetworkNode): number {
  return 1 + node.referrals.reduce((acc, child) => acc + countTreeNodes(child), 0)
}

// ─── V2 Executive Network Tree ──────────────────────────────────────────────────

function resolveNodeTier(node: GenealogyProjectionNode): NodeTier {
  if (node.level === 0) return 'root'
  if (node.actorType === 'PASSENGER') return 'client'
  if (node.level === 1) return 'leader'
  return 'operator'
}

/**
 * Resolve the influence tier for a node.
 * Rules (evaluated in order):
 *   ROOT      — level === 0
 *   CLIENT    — PASSENGER actor
 *   ELITE     — DRIVER with ≥ 5 direct children
 *   HUB       — DRIVER with ≥ 3 direct children
 *   EXPANSION — DRIVER at level 1 with at least 1 child
 *   OPERATIONAL — DRIVER at level > 1
 *   BEGINNER  — DRIVER at level 1 with no children
 */
export function resolveInfluenceTier(
  node: GenealogyProjectionNode,
  childCount: number,
): InfluenceTier {
  if (node.level === 0) return 'ROOT'
  if (node.actorType === 'PASSENGER') return 'CLIENT'
  if (childCount >= 5) return 'ELITE'
  if (childCount >= 3) return 'HUB'
  if (node.level === 1 && childCount > 0) return 'EXPANSION'
  if (node.level > 1) return 'OPERATIONAL'
  return 'BEGINNER'
}

function buildChildrenMapV2(
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

function buildChildCountMap(
  edges: GenealogyProjectionEdge[],
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const edge of edges) {
    counts.set(edge.sourceActorId, (counts.get(edge.sourceActorId) ?? 0) + 1)
  }
  return counts
}

function mapProjectionNode(
  node: GenealogyProjectionNode,
  childrenMap: Map<string | null, GenealogyProjectionNode[]>,
  childCountMap: Map<string, number>,
): ExecutiveGenealogyNode {
  const childCount = childCountMap.get(node.actorId) ?? 0
  const rawChildren = childrenMap.get(node.actorId) ?? []
  return {
    actorId: node.actorId,
    actorType: node.actorType,
    name: node.name,
    level: node.level,
    absoluteDepth: node.absoluteDepth,
    flowType: node.flowType,
    parentId: node.parentId,
    tier: resolveNodeTier(node),
    isHub: node.actorType === 'DRIVER' && childCount >= 3,
    influenceTier: resolveInfluenceTier(node, childCount),
    children: rawChildren.map(child => mapProjectionNode(child, childrenMap, childCountMap)),
    metrics: {
      activePassengers: 0,
      activeDrivers: 0,
      completedRides: 0,
      estimatedRevenueCents: 0,
      networkDepth: 0,
    },
    ownership: node.rootDriverId ? { rootDriverId: node.rootDriverId } : undefined,
    territory: node.territory ?? null,
  }
}

/**
 * Transform a flat GenealogyProjection into a recursive ExecutiveGenealogyNode tree.
 * Parent-child relationships are reconstructed from node.parentId.
 * Hub detection and influence tiers are derived from projection.edges[].
 * Metrics are stub zeros until the backend ships per-node metrics (Phase 3).
 */
export function buildExecutiveTree(projection: GenealogyProjection): ExecutiveGenealogyNode[] {
  const { nodes, edges } = projection
  const childrenMap = buildChildrenMapV2(nodes)
  const childCountMap = buildChildCountMap(edges)
  const roots = childrenMap.get(null) ?? nodes.filter(n => n.level === 0)
  return roots.map(root => mapProjectionNode(root, childrenMap, childCountMap))
}
