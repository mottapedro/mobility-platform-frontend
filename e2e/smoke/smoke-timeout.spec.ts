import { test, expect } from './support/fixtures'

// Backend TTL for immediate offers is 2 minutes (AcceptancePolicyEngine.computeOfferExpiry).
test('timeout path: driver ignores offer → offer expires', async ({ actors }) => {
  test.slow()
  const { api, env, passengerSession, driverSession } = actors

  const scheduledAt = new Date(Date.now() + 5 * 60_000).toISOString()
  const ride = await api.createRide({
    passengerId: passengerSession.passengerId,
    origin: env.originAddress,
    destination: env.destinationAddress,
    scheduledAt,
  })

  const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id, { timeoutMs: 45_000 })
  const expiresAt = new Date(offer.expiresAt).getTime()
  const waitMs = Math.max(0, expiresAt - Date.now()) + 5_000

  await new Promise((r) => setTimeout(r, waitMs))

  // After expiry, the offer must not be returned as a PENDING active offer.
  const stillActive = await api.listDriverOffers(driverSession.driverId)
  expect(stillActive.find((o) => o.id === offer.id)).toBeUndefined()

  // Ride must not have been assigned to this driver via the expired offer.
  const after = await api.getRide(ride.id)
  expect(after.selectedDriverId).not.toBe(driverSession.driverId)
})
