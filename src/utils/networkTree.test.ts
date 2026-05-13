import { sanitizeNetworkTree, countTreeNodes } from './networkTree'
import type { DriverNetworkNode } from '../types'

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
