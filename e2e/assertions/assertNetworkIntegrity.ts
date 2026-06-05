import { expect } from '@playwright/test';
import { getNetworkContext } from '../shared/api/networkApi';
import type { CapabilityMap, GenealogyNode } from '../shared/api/networkApi';
import { SmokeContext } from '../shared/context/smokeContext';

function printCapabilities(capabilities: CapabilityMap) {
  const caps: Array<{ key: keyof CapabilityMap; label: string }> = [
    { key: 'd2d', label: 'D2D' },
    { key: 'd2p', label: 'D2P' },
    { key: 'p2p', label: 'P2P' },
  ];
  caps.forEach(c => {
    const ok = capabilities[c.key] ? '\u2713' : '\u2717';
    console.log(`${ok} ${c.label}`);
  });
}

export async function assertNetworkIntegrity(ctx: SmokeContext) {
  const context = await getNetworkContext(ctx);
  expect(context).toBeDefined();
  expect(context.state).toBe('ACTIVE');
  expect(context.rootDriverId).toBeTruthy();
  expect(context.actorId).toBeTruthy();
  expect(context.ownership).toBeDefined();
  expect(context.relationships).toBeDefined();
  expect(Array.isArray(context.genealogy)).toBe(true);
  expect((context.genealogy as GenealogyNode[]).length).toBeGreaterThan(0);

  // Diagnóstico operacional
  console.log('\nNetwork Context Audit');
  console.log('----------------------');
  console.log('API URL:', process.env.SMOKE_API_URL);
  console.log('Network State:', context.state);
  console.log('Actor Type:', context.ownership?.type || 'N/A');
  console.log('Driver ID:', ctx.driverId);
  console.log('Root Driver ID:', context.rootDriverId);
  if (context.rootDriverName) {
    console.log('Root Driver Name:', context.rootDriverName);
  }
  console.log('Relationships Count:', Array.isArray(context.relationships) ? context.relationships.length : 'N/A');
  console.log('Ownership Type:', context.ownership?.type || 'N/A');
  // Capabilities
  console.log('Capabilities:');
  const caps: CapabilityMap = context.capabilities ?? context.inviteCapabilities ?? {};
  printCapabilities(caps);
  console.log('----------------------\n');
}
