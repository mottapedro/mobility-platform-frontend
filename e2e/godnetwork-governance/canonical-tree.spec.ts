import { test, expect } from '@playwright/test';
import { getCanonicalTree } from '../../src/services/network';

test('GODNETWORK — árvore canônica por IDs', async () => {
  const tree = await getCanonicalTree();
  // Valida root, filhos, parentId, depth, sem órfãos/duplicatas
  expect(tree.root).toBeDefined();
  expect(tree.nodes.length).toBeGreaterThan(0);
  const ids = new Set();
  tree.nodes.forEach(node => {
    expect(node.id).toBeTruthy();
    expect(ids.has(node.id)).toBe(false);
    ids.add(node.id);
    if (node.parentId) {
      expect(tree.nodes.find(n => n.id === node.parentId)).toBeDefined();
    }
    expect(typeof node.depth).toBe('number');
    // Exibe para auditoria
    console.log(`${'  '.repeat(node.depth)}${node.publicSlug} (${node.name}) parent=${node.parentId}`);
  });
});
