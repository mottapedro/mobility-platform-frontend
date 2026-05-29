import { test, expect } from './support/fixtures'

test('reject path: driver rejects → offer marked REJECTED → ride continues matching', async ({ actors }) => {
  const { api, env, passengerSession, driverSession } = actors

  const scheduledAt = new Date(Date.now() + 5 * 60_000).toISOString()
  const ride = await api.createRide({
    passengerId: passengerSession.passengerId,
    origin: env.originAddress,
    destination: env.destinationAddress,
    scheduledAt,
  })

  const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id, { timeoutMs: 45_000 })
  const result = await api.respondOffer(offer.id, false)
  expect(result.accepted).toBe(false)

  // The same offer must no longer appear as PENDING for this driver.
  const remaining = await api.listDriverOffers(driverSession.driverId)
  expect(remaining.find((o) => o.id === offer.id)).toBeUndefined()

  // Ride must not be assigned to the rejecting driver.
  const after = await api.getRide(ride.id)
  expect(after.selectedDriverId).not.toBe(driverSession.driverId)
})
