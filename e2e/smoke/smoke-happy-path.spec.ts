import { test, expect } from './support/fixtures'

test('happy path: passenger creates ride → driver receives offer → accepts → ride ASSIGNED', async ({ actors }) => {
  const { api, env, passengerSession, driverSession, passengerPage, driverPage } = actors

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
  expect(ride.id).toBeTruthy()
  expect(['MATCHING', 'WAITING_REFERRAL']).toContain(ride.status)

  // Driver receives offer.
  const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id, { timeoutMs: 45_000 })
  expect(offer.status).toBe('PENDING')
  expect(offer.rideRequest.id).toBe(ride.id)

  // Driver accepts.
  const result = await api.respondOffer(offer.id, true)
  expect(result.accepted).toBe(true)

  // Passenger side observes driver assignment.
  const final = await api.waitForRideStatus(
    ride.id,
    (r) => r.selectedDriverId === driverSession.driverId,
    { timeoutMs: 20_000 }
  )
  expect(final.selectedDriverId).toBe(driverSession.driverId)
})
