import type { TestInfo } from '@playwright/test'

export interface SmokeEvidence {
  rideId?: string
  offerId?: string
  driverId?: string
  passengerId?: string
  rideStatus?: string
  selectedDriverId?: string | null
  extra?: Record<string, unknown>
}

/**
 * Attaches the operational ids of the smoke run to the Playwright report so a
 * failing test surfaces "rideId=..., offerId=..." instead of a generic timeout.
 */
export async function attachSmokeEvidence(testInfo: TestInfo, evidence: SmokeEvidence): Promise<void> {
  const body = JSON.stringify(evidence, null, 2)
  await testInfo.attach('smoke-evidence.json', { body, contentType: 'application/json' })
  console.log(`[smoke-evidence] ${testInfo.title} → ${body.replace(/\s+/g, ' ')}`)
}
