import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'

// @slow @nightly: invariant probes the matching cycle until the ride leaves MATCHING.
// Backend invariant: a single ride must NEVER have more than one PENDING RideOffer
// at the same instant. RespondToRideOfferUseCase enforces this transactionally on
// accept; this smoke verifies it end-to-end across the dispatch lifecycle.
test('dispatch invariant: at most one PENDING offer per ride at all times @slow', async ({ actors }, testInfo) => {
  test.slow()
  const { api, env, passengerSession, driverSession } = actors
  const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
    driverId: driverSession.driverId,
    passengerId: passengerSession.passengerId,
    extra: { observations: [] as Array<{ at: string; pending: number; rideStatus: string }> },
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

    // Sample the ride state up to ~30s. We accept the test once the ride leaves
    // the matching window (driver accepts/rejects via another path) OR after the
    // sampling window closes — in both cases the invariant must hold at every
    // single observation.
    const deadline = Date.now() + 30_000
    let observed = 0
    let maxPending = 0
    let lastSnapshot: { id: string; status: string; pending: number } | null = null

    while (Date.now() < deadline) {
      const snap = await api.getRideWithOffers(ride.id)
      const pendingOffers = snap.offers.filter((o) => o.status === 'PENDING')
      const pending = pendingOffers.length

      ;(evidence.extra!.observations as Array<{ at: string; pending: number; rideStatus: string }>).push({
        at: new Date().toISOString(),
        pending,
        rideStatus: snap.status,
      })

      // Hard invariant.
      expect.soft(pending, `Ride ${snap.id} violated dispatch invariant: ${pending} PENDING offers`).toBeLessThanOrEqual(1)
      if (pending > maxPending) maxPending = pending

      lastSnapshot = { id: snap.id, status: snap.status, pending }
      observed += 1

      // Once ride leaves MATCHING the dispatch loop is over.
      if (snap.status !== 'MATCHING' && snap.status !== 'WAITING_REFERRAL') break

      await new Promise((r) => setTimeout(r, 1_000))
    }

    evidence.rideStatus = lastSnapshot?.status
    evidence.extra = { ...(evidence.extra as object), observed, maxPending }

    expect(observed).toBeGreaterThan(0)
    expect(maxPending).toBeLessThanOrEqual(1)
  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
