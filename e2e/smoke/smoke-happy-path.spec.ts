import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'

test('happy path: passenger creates ride → driver receives offer → accepts → ride ACCEPTED', async ({ actors }, testInfo) => {
  const { api, env, passengerSession, driverSession, passengerPage, driverPage } = actors
  const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
    driverId: driverSession.driverId,
    passengerId: passengerSession.passengerId,
  }

  try {
    // Warm-up: both apps reachable.
    await passengerPage.goto('/')
    await driverPage.goto('/driver/offers')

    // Passenger creates ride (scheduled 5 min ahead to satisfy "future date" validation).
    const scheduledAt = new Date(Date.now() + 5 * 60_000).toISOString()
    const ride = await api.createRide({
      passengerId: passengerSession.passengerId,
      origin: env.originAddress,
      destination: env.destinationAddress,
      scheduledAt,
    })
    evidence.rideId = ride.id
    expect(ride.id).toBeTruthy()
    expect(['MATCHING', 'WAITING_REFERRAL']).toContain(ride.status)

    // Driver receives offer.
    const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id, { timeoutMs: 45_000 })
    evidence.offerId = offer.id
    expect(offer.status).toBe('PENDING')
    expect(offer.rideRequest.id).toBe(ride.id)

    // Driver accepts.
    const result = await api.respondOffer(offer.id, true)
    expect(result.accepted).toBe(true)

    // Passenger side observes driver assignment AND ride in terminal-accept status.
    const final = await api.waitForRideStatus(
      ride.id,
      (r) => r.selectedDriverId === driverSession.driverId && r.status === 'ACCEPTED',
      { timeoutMs: 20_000 }
    )
    evidence.selectedDriverId = final.selectedDriverId
    evidence.rideStatus = final.status
    expect(final.selectedDriverId).toBe(driverSession.driverId)
    expect(final.status).toBe('ACCEPTED')
  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
