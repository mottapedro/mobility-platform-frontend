import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'

// @slow @nightly: rejection triggers backend re-dispatch logic; gated out of PR runs.
test('reject path: driver rejects → offer REJECTED, rejecting driver excluded, ride keeps matching @slow', async ({
  actors,
}, testInfo) => {
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

    const result = await api.respondOffer(offer.id, false)
    expect(result.accepted).toBe(false)

    // The rejected offer must not reappear as PENDING for this driver.
    const remaining = await api.listDriverOffers(driverSession.driverId)
    expect(remaining.find((o) => o.id === offer.id)).toBeUndefined()

    // Ride must NOT have transitioned into terminal ACCEPTED state and the
    // rejecting driver must not own it. A valid post-state is one of:
    //   - MATCHING / WAITING_REFERRAL → backend keeps searching;
    //   - EXPIRED → cutoff hit, fallback exhausted (acceptable on tiny seed).
    const after = await api.getRide(ride.id)
    evidence.rideStatus = after.status
    evidence.selectedDriverId = after.selectedDriverId
    expect(after.selectedDriverId).not.toBe(driverSession.driverId)
    expect(after.status).not.toBe('ACCEPTED')
    expect(['MATCHING', 'WAITING_REFERRAL', 'EXPIRED']).toContain(after.status)
  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
