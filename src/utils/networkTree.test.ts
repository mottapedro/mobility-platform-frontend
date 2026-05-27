import { sanitizeNetworkTree, countTreeNodes, buildExecutiveTree, resolveInfluenceTier } from './networkTree'
import type { DriverNetworkNode } from '../types'
import type { GenealogyProjection, GenealogyProjectionNode } from '../types/network-v2'

function node(
  id: string,
  depth: number,
  referrals: DriverNetworkNode[] = [],
): DriverNetworkNode {
  return { id, name: `Driver ${id}`, depth, referrals }
}

describe('sanitizeNetworkTree', () => {
  it('returns the node unchanged when there are no cycles', () => {
    const tree = node('a', 0, [node('b', 1, [node('c', 2)])])
    const result = sanitizeNetworkTree(tree)
    expect(result.id).toBe('a')
    expect(result.referrals[0].id).toBe('b')
    expect(result.referrals[0].referrals[0].id).toBe('c')
  })

  it('cuts a direct self-referral cycle', () => {
    const self: DriverNetworkNode = node('a', 0)
    // inject a cycle: a → a
    self.referrals = [self]
    const result = sanitizeNetworkTree(self)
    // the child 'a' is cut (referrals emptied)
    expect(result.referrals[0].referrals).toHaveLength(0)
  })

  it('cuts an indirect cycle (a → b → a)', () => {
    const a: DriverNetworkNode = node('a', 0)
    const b: DriverNetworkNode = node('b', 1)
    a.referrals = [b]
    b.referrals = [a] // cycle back to a
    const result = sanitizeNetworkTree(a)
    const bResult = result.referrals[0]
    expect(bResult.id).toBe('b')
    // a appears again under b but its referrals must be cut
    expect(bResult.referrals[0].referrals).toHaveLength(0)
  })

  it('preserves multiple independent branches', () => {
    const tree = node('root', 0, [
      node('x', 1, [node('x1', 2)]),
      node('y', 1, [node('y1', 2)]),
    ])
    const result = sanitizeNetworkTree(tree)
    expect(result.referrals).toHaveLength(2)
    expect(result.referrals[0].referrals[0].id).toBe('x1')
    expect(result.referrals[1].referrals[0].id).toBe('y1')
  })
})

describe('countTreeNodes', () => {
  it('counts a single node as 1', () => {
    expect(countTreeNodes(node('a', 0))).toBe(1)
  })

  it('counts all nodes in a linear chain', () => {
    const tree = node('a', 0, [node('b', 1, [node('c', 2)])])
    expect(countTreeNodes(tree)).toBe(3)
  })

  it('counts all nodes in a branching tree', () => {
    const tree = node('root', 0, [
      node('x', 1, [node('x1', 2), node('x2', 2)]),
      node('y', 1),
    ])
    // root + x + x1 + x2 + y = 5
    expect(countTreeNodes(tree)).toBe(5)
  })
})

// ─── V2: resolveInfluenceTier ─────────────────────────────────────────────

function projNode(
  overrides: Partial<GenealogyProjectionNode> & Pick<GenealogyProjectionNode, 'actorId' | 'actorType' | 'level'>,
): GenealogyProjectionNode {
  return {
    name: 'Test Driver',
    flowType: 'DRIVER_TO_DRIVER',
    rootDriverId: 'root',
    parentId: null,
    publicSlug: null,
    referralCode: null,
    networkLevel: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('resolveInfluenceTier', () => {
  it('returns ROOT for level 0', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'r', actorType: 'DRIVER', level: 0 }), 5)).toBe('ROOT')
  })

  it('returns CLIENT for PASSENGER regardless of childCount', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'p', actorType: 'PASSENGER', level: 1 }), 10)).toBe('CLIENT')
  })

  it('returns ELITE for DRIVER with >= 5 children', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 5)).toBe('ELITE')
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 7)).toBe('ELITE')
  })

  it('returns HUB for DRIVER with 3 or 4 children', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 3)).toBe('HUB')
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 4)).toBe('HUB')
  })

  it('returns EXPANSION for level-1 DRIVER with 1-2 children', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 1)).toBe('EXPANSION')
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 2)).toBe('EXPANSION')
  })

  it('returns OPERATIONAL for DRIVER at level > 1', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 2 }), 0)).toBe('OPERATIONAL')
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 3 }), 2)).toBe('OPERATIONAL')
  })

  it('returns BEGINNER for level-1 DRIVER with no children', () => {
    expect(resolveInfluenceTier(projNode({ actorId: 'd', actorType: 'DRIVER', level: 1 }), 0)).toBe('BEGINNER')
  })
})

// ─── V2: buildExecutiveTree ───────────────────────────────────────────────

const projectionFixture: GenealogyProjection = {
  rootDriver: { id: 'drv-root', name: 'Pedro Motta', experienceLevel: null, networkLevel: 1, publicSlug: 'pedro-motta', referralCode: 'pedro-code' },
  stats: { totalNodes: 3, totalEdges: 2, maxDepth: 2, appliedDepthLimit: 5 },
  nodes: [
    { actorId: 'drv-root', actorType: 'DRIVER', name: 'Pedro Motta', level: 0, parentId: null, networkLevel: 1, flowType: 'DRIVER_TO_DRIVER', rootDriverId: 'drv-root', publicSlug: 'pedro-motta', referralCode: 'pedro-code', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { actorId: 'drv-a', actorType: 'DRIVER', name: 'Alice Ferreira', level: 1, parentId: 'drv-root', networkLevel: 2, flowType: 'DRIVER_TO_DRIVER', rootDriverId: 'drv-root', publicSlug: 'alice', referralCode: null, isActive: true, createdAt: '2026-01-02T00:00:00Z' },
    { actorId: 'psg-b', actorType: 'PASSENGER', name: 'Bob Alves', level: 1, parentId: 'drv-root', networkLevel: 1, flowType: 'DRIVER_TO_PASSENGER', rootDriverId: 'drv-root', publicSlug: null, referralCode: null, isActive: true, createdAt: '2026-01-03T00:00:00Z' },
  ],
  edges: [
    { sourceActorId: 'drv-root', targetActorId: 'drv-a', flowType: 'DRIVER_TO_DRIVER' },
    { sourceActorId: 'drv-root', targetActorId: 'psg-b', flowType: 'DRIVER_TO_PASSENGER' },
  ],
  levels: [{ depth: 0, nodeIds: ['drv-root'] }, { depth: 1, nodeIds: ['drv-a', 'psg-b'] }],
  metrics: { totalDrivers: 2, totalPassengers: 1, totalRelationships: 2, totalD2D: 1, totalD2P: 1, totalP2P: 0, maxDepth: 1 },
}

describe('buildExecutiveTree', () => {
  it('returns a single root node', () => {
    const tree = buildExecutiveTree(projectionFixture)
    expect(tree).toHaveLength(1)
    expect(tree[0].actorId).toBe('drv-root')
  })

  it('root has correct tier and influenceTier', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    expect(root.tier).toBe('root')
    expect(root.influenceTier).toBe('ROOT')
  })

  it('root has 2 children', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    expect(root.children).toHaveLength(2)
  })

  it('DRIVER child at level 1 gets leader tier and BEGINNER influence (no sub-children)', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    const alice = root.children.find(c => c.actorId === 'drv-a')!
    expect(alice.tier).toBe('leader')
    expect(alice.influenceTier).toBe('BEGINNER')
    expect(alice.children).toHaveLength(0)
  })

  it('PASSENGER child gets client tier and CLIENT influence', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    const bob = root.children.find(c => c.actorId === 'psg-b')!
    expect(bob.tier).toBe('client')
    expect(bob.influenceTier).toBe('CLIENT')
  })

  it('root is not a hub (only 2 direct children, threshold is 3)', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    expect(root.isHub).toBe(false)
  })

  it('all nodes have stub zero metrics', () => {
    const [root] = buildExecutiveTree(projectionFixture)
    expect(root.metrics.completedRides).toBe(0)
    expect(root.metrics.activePassengers).toBe(0)
    expect(root.children[0].metrics.estimatedRevenueCents).toBe(0)
  })
})
