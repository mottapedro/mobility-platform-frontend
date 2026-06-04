import { test } from '@playwright/test';
import { createSmokeContext } from '../shared/context/smokeContext';
import { assertReferralUrls } from '../assertions/assertReferralUrls';

test('Referral URLs — cobertura mínima', async () => {
  const ctx = await createSmokeContext();
  await assertReferralUrls(ctx);
});
