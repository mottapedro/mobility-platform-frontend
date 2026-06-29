import { test, expect } from '@playwright/test'
import { SmokeApi } from '../smoke/support/api'
import { loadSmokeEnv } from '../smoke/support/env'
import { attachSmokeEvidence } from '../smoke/support/evidence'

// Backend invariant: a ride must NEVER have more than one PENDING RideOffer
// simultaneously. This spec probes the full dispatch lifecycle — from ride
// creation to terminal state — sampling COUNT(PENDING) every 1.5 s.

const env = loadSmokeEnv()

let api: SmokeApi
let driver: Awaited<ReturnType<SmokeApi['loginDriver']>>
let passenger: Awaited<ReturnType<SmokeApi['loginPassenger']>>

test.describe('Offer Invariant — COUNT(PENDING) ≤ 1 durante todo o ciclo de dispatch', () => {
  test.skip(!env, 'Smoke env not configured: set SMOKE_API_URL + SMOKE_{PASSENGER,DRIVER}_{EMAIL,PASSWORD}')

  let createdRideId: string | undefined

  test.beforeAll(async () => {
    api = await SmokeApi.create(env!.apiUrl)
    driver = await api.loginDriver(env!.driverEmail, env!.driverPassword)
    passenger = await api.loginPassenger(env!.passengerEmail, env!.passengerPassword)
  })

  test.afterAll(async () => {
    if (createdRideId) await api.tryCancel(createdRideId, passenger.token).catch(() => {})
    await api?.dispose()
  })

  test('no máximo 1 oferta PENDING por corrida em qualquer instante @slow', async ({}, testInfo) => {
    test.slow()

    const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
      driverId: driver.driverId,
      passengerId: passenger.passengerId,
      extra: { observations: [] as Array<{ at: string; pending: number; rideStatus: string }> },
    }

    try {
      // scheduledAt 120 h ahead — distinct from dispatch-lifecycle (72-78 h) and contract (90 h).
      const scheduledAt = new Date(Date.now() + 120 * 60 * 60_000).toISOString()
      const ride = await api.createRideOrReclaim({
        passengerId: passenger.passengerId,
        origin: env!.originAddress,
        destination: env!.destinationAddress,
        scheduledAt,
        originLat: -23.5613,
        originLng: -46.6565,
        destinationLat: -23.5631,
        destinationLng: -46.6543,
      },
        passenger.token,
      )
      evidence.rideId = ride.id
      createdRideId = ride.id

      const deadline = Date.now() + 60_000
      let observed = 0
      let maxPending = 0

      while (Date.now() < deadline) {
        const snap = await api.getRideWithOffers(ride.id)
        const pending = snap.offers.filter(o => o.status === 'PENDING').length

        ;(evidence.extra!.observations as Array<{ at: string; pending: number; rideStatus: string }>).push({
          at: new Date().toISOString(),
          pending,
          rideStatus: snap.status,
        })

        // Hard invariant — fails immediately on violation.
        expect(
          pending,
          `Ride ${snap.id} violated dispatch invariant: ${pending} PENDING offers at once`,
        ).toBeLessThanOrEqual(1)

        if (pending > maxPending) maxPending = pending
        observed += 1

        // Stop once the ride is in a terminal or post-matching state.
        if (!['MATCHING', 'WAITING_REFERRAL', 'WAITING_PARTNER'].includes(snap.status)) break

        await new Promise(r => setTimeout(r, 1_500))
      }

      evidence.rideStatus = (await api.getRide(ride.id)).status
      evidence.extra = { ...(evidence.extra as object), observed, maxPending }

      expect(observed, 'Must have sampled at least once').toBeGreaterThan(0)
      // Confirm the invariant held globally (maxPending is our summary metric).
      expect(maxPending, 'Max simultaneous PENDING offers must be ≤ 1').toBeLessThanOrEqual(1)

      console.log(`[offer-invariant] observed=${observed} maxPending=${maxPending} finalStatus=${evidence.rideStatus}`)
    } finally {
      await attachSmokeEvidence(testInfo, evidence)
    }
  })
})
