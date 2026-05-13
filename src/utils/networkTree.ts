import type { DriverNetworkNode } from '../types'

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
