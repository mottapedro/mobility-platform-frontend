import { test } from '@playwright/test';
import { createSmokeContext } from '../shared/context/smokeContext';
import { assertNetworkIntegrity } from '../assertions/assertNetworkIntegrity';

test('Network Context — estrutura mínima', async () => {
  const ctx = await createSmokeContext();
  await assertNetworkIntegrity(ctx);
});
