import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'

// @slow @nightly: waits the full offer TTL (immediate rides = 2 min). Excluded from PR runs.
test('timeout path: driver ignores offer → offer expires @slow', async ({ actors }, testInfo) => {
  test.slow()
  const { api, env, passengerSession, driverSession } = actors
  const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
    driverId: driverSession.driverId,
    passengerId: passengerSession.passengerId,
  }

  try {
    const scheduledAt = new Date(Date.now() + 5 * 60_000).toISOString()
    const ride = await api.createRide({
      passengerId: passengerSession.passengerId,
      origin: env.originAddress,
      destination: env.destinationAddress,
      scheduledAt,
    })
    evidence.rideId = ride.id

    const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id, { timeoutMs: 45_000 })
    evidence.offerId = offer.id

    const expiresAt = new Date(offer.expiresAt).getTime()
    const waitMs = Math.max(0, expiresAt - Date.now()) + 5_000
    await new Promise((r) => setTimeout(r, waitMs))

    // Expired offer must drop out of the active PENDING list.
    const stillActive = await api.listDriverOffers(driverSession.driverId)
    expect(stillActive.find((o) => o.id === offer.id)).toBeUndefined()

    // Ride must not silently land on the unresponsive driver.
    const after = await api.getRide(ride.id)
    evidence.rideStatus = after.status
    evidence.selectedDriverId = after.selectedDriverId
    expect(after.selectedDriverId).not.toBe(driverSession.driverId)
    expect(after.status).not.toBe('ACCEPTED')
  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
