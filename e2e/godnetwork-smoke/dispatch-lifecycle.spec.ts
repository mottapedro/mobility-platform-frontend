import { test, expect } from '@playwright/test'
import { SmokeApi } from '../smoke/support/api'
import { loadSmokeEnv } from '../smoke/support/env'
import { attachSmokeEvidence } from '../smoke/support/evidence'

// ── Types ──────────────────────────────────────────────────────────────────

interface RideSnapshot {
  at: string
  status: string
  dispatchStage: string | null
  pendingOfferCount: number
}

// Known dispatch stage rank for monotone-progression assertion.
const STAGE_RANK: Record<string, number> = {
  REFERRAL_DIRECT: 0,
  REFERRAL_NETWORK: 1,
  GLOBAL: 2,
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function snapshotRide(api: SmokeApi, rideId: string): Promise<RideSnapshot> {
  const ride = await api.getRideWithOffers(rideId)
  return {
    at: new Date().toISOString(),
    status: ride.status,
    dispatchStage: (ride as Record<string, unknown>).currentDispatchStage as string | null ?? null,
    pendingOfferCount: ride.offers.filter(o => o.status === 'PENDING').length,
  }
}

function assertDispatchInvariant(snapshots: RideSnapshot[], label: string): void {
  snapshots.forEach((s, i) => {
    expect.soft(
      s.pendingOfferCount,
      `[${label}] snapshot[${i}] t=${s.at} status=${s.status}: ${s.pendingOfferCount} PENDING offers violates COUNT(PENDING)≤1 invariant`,
    ).toBeLessThanOrEqual(1)
  })
}

function logTable(snapshots: RideSnapshot[]): void {
  console.table(snapshots.map(s => ({
    status: s.status,
    stage: s.dispatchStage ?? '—',
    pending: s.pendingOfferCount,
    at: s.at,
  })))
}

// ── Suite setup ────────────────────────────────────────────────────────────

const env = loadSmokeEnv()

let api: SmokeApi
let driver: Awaited<ReturnType<SmokeApi['loginDriver']>>
let passenger: Awaited<ReturnType<SmokeApi['loginPassenger']>>

test.describe('Dispatch Lifecycle — RideStatus × DispatchStage × COUNT(PENDING)', () => {
  test.skip(!env, 'Smoke env not configured: set SMOKE_API_URL + SMOKE_{PASSENGER,DRIVER}_{EMAIL,PASSWORD}')

  // Collect every ride created during the suite so afterAll can cancel them,
  // preventing SCHEDULE_CONFLICT (409) in subsequent runs.
  const createdRideIds: string[] = []

  test.beforeAll(async () => {
    api = await SmokeApi.create(env!.apiUrl)
    driver = await api.loginDriver(env!.driverEmail, env!.driverPassword)
    passenger = await api.loginPassenger(env!.passengerEmail, env!.passengerPassword)
  })

  test.afterAll(async () => {
    // Best-effort cleanup so the backend doesn't accumulate stale active rides.
    for (const id of createdRideIds) {
      await api.tryCancel(id, passenger.token).catch(() => {})
    }
    await api?.dispose()
  })

  // ── Scenario 1: driver accepts → ride ACCEPTED ───────────────────────────
  test('scenario-1: WAITING_REFERRAL → driver accepts → ACCEPTED + invariant holds', async ({}, testInfo) => {
    const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
      driverId: driver.driverId,
      passengerId: passenger.passengerId,
    }
    const snapshots: RideSnapshot[] = []

    try {
      // Slot 0 (72 h): operationalCutoffAt = now+48 h (in the future).
      const scheduledAt = new Date(Date.now() + 72 * 60 * 60_000).toISOString()
      const ride = await api.createRideOrReclaim(
        { passengerId: passenger.passengerId, origin: env!.originAddress, destination: env!.destinationAddress, scheduledAt },
        passenger.token,
      )
      evidence.rideId = ride.id
      createdRideIds.push(ride.id)
      expect(['MATCHING', 'WAITING_REFERRAL']).toContain(ride.status)

      // Poll for offer while collecting snapshots.
      const deadline = Date.now() + 45_000
      let offer: Awaited<ReturnType<typeof api.listDriverOffers>>[number] | null = null
      while (!offer && Date.now() < deadline) {
        snapshots.push(await snapshotRide(api, ride.id))
        const offers = await api.listDriverOffers(driver.driverId)
        offer = offers.find(o => o.rideRequest?.id === ride.id && o.status === 'PENDING') ?? null
        if (!offer) await new Promise(r => setTimeout(r, 1_500))
      }
      if (!offer) throw new Error(`No offer for ride ${ride.id} within 45 s`)
      evidence.offerId = offer.id

      // Accept.
      const result = await api.respondOffer(offer.id, true)
      expect(result.accepted).toBe(true)

      // Wait for ACCEPTED.
      const final = await api.waitForRideStatus(
        ride.id,
        r => r.status === 'ACCEPTED',
        { timeoutMs: 20_000 },
      )
      evidence.rideStatus = final.status
      evidence.selectedDriverId = final.selectedDriverId

      expect(final.status).toBe('ACCEPTED')
      expect(final.selectedDriverId).toBe(driver.driverId)
      assertDispatchInvariant(snapshots, 'scenario-1')
      logTable(snapshots)
    } finally {
      evidence.extra = { snapshots }
      await attachSmokeEvidence(testInfo, evidence)
    }
  })

  // ── Scenario 2: driver rejects → ride keeps matching ─────────────────────
  test('scenario-2: WAITING_REFERRAL → driver rejects → offer REJECTED, ride re-dispatched', async ({}, testInfo) => {
    const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
      driverId: driver.driverId,
      passengerId: passenger.passengerId,
    }
    const snapshots: RideSnapshot[] = []

    try {
      // Slot 1 (74 h) — distinct from scenario-1 (72 h).
      const scheduledAt = new Date(Date.now() + 74 * 60 * 60_000).toISOString()
      const ride = await api.createRide(
        { passengerId: passenger.passengerId, origin: env!.originAddress, destination: env!.destinationAddress, scheduledAt },
        passenger.token,
      )
      evidence.rideId = ride.id
      createdRideIds.push(ride.id)

      snapshots.push(await snapshotRide(api, ride.id))
      const offer = await api.waitForOfferForRide(driver.driverId, ride.id, { timeoutMs: 45_000 })
      evidence.offerId = offer.id
      snapshots.push(await snapshotRide(api, ride.id))

      // Reject.
      const result = await api.respondOffer(offer.id, false)
      expect(result.accepted).toBe(false)

      snapshots.push(await snapshotRide(api, ride.id))

      // The rejected offer must no longer appear as PENDING.
      const remaining = await api.listDriverOffers(driver.driverId)
      expect(remaining.find(o => o.id === offer.id)).toBeUndefined()

      const after = await api.getRide(ride.id)
      evidence.rideStatus = after.status
      evidence.selectedDriverId = after.selectedDriverId

      expect(after.selectedDriverId).not.toBe(driver.driverId)
      expect(after.status).not.toBe('ACCEPTED')
      expect(['MATCHING', 'WAITING_REFERRAL', 'WAITING_PARTNER', 'EXPIRED']).toContain(after.status)
      assertDispatchInvariant(snapshots, 'scenario-2')
      logTable(snapshots)
    } finally {
      evidence.extra = { snapshots }
      await attachSmokeEvidence(testInfo, evidence)
    }
  })

  // ── Scenario 3: offer has valid future TTL + COUNT(PENDING) ≤ 1 ──────────
  // Note: waiting for the offer to naturally expire exceeds the 3-minute test
  // budget for pre-scheduled rides (backend TTL >> 180 s). The full expiry
  // behavior for immediate rides is verified in e2e/smoke/smoke-timeout.spec.ts.
  test('scenario-3: offer dispatched for pre-scheduled ride has valid future TTL + COUNT(PENDING) ≤ 1', async ({}, testInfo) => {
    const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
      driverId: driver.driverId,
      passengerId: passenger.passengerId,
    }
    const snapshots: RideSnapshot[] = []

    try {
      // Slot 2 (76 h) — distinct from scenario-1 (72 h) and scenario-2 (74 h).
      const scheduledAt = new Date(Date.now() + 76 * 60 * 60_000).toISOString()
      const ride = await api.createRideOrReclaim(
        { passengerId: passenger.passengerId, origin: env!.originAddress, destination: env!.destinationAddress, scheduledAt },
        passenger.token,
      )
      evidence.rideId = ride.id
      createdRideIds.push(ride.id)

      const offer = await api.waitForOfferForRide(driver.driverId, ride.id, { timeoutMs: 45_000 })
      evidence.offerId = offer.id

      snapshots.push(await snapshotRide(api, ride.id))

      // The offer must carry a valid future TTL.
      const expiresAt = new Date(offer.expiresAt).getTime()
      expect(
        expiresAt,
        `Offer expiresAt must be in the future (got ${offer.expiresAt})`,
      ).toBeGreaterThan(Date.now())

      evidence.rideStatus = snapshots.at(-1)?.status
      assertDispatchInvariant(snapshots, 'scenario-3')
      logTable(snapshots)
    } finally {
      evidence.extra = { snapshots }
      await attachSmokeEvidence(testInfo, evidence)
    }
  })

  // ── Scenario 4: stage progression is monotone @slow ──────────────────────
  test('scenario-4: dispatch stage progression is monotone REFERRAL_DIRECT → REFERRAL_NETWORK → GLOBAL @slow', async ({}, testInfo) => {
    test.slow()
    const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
      driverId: driver.driverId,
      passengerId: passenger.passengerId,
    }
    const snapshots: RideSnapshot[] = []

    try {
      // Slot 3 (78 h) — distinct from scenarios 1-3.
      const scheduledAt = new Date(Date.now() + 78 * 60 * 60_000).toISOString()
      const ride = await api.createRideOrReclaim(
        { passengerId: passenger.passengerId, origin: env!.originAddress, destination: env!.destinationAddress, scheduledAt },
        passenger.token,
      )
      evidence.rideId = ride.id
      createdRideIds.push(ride.id)

      // Poll until ride reaches a terminal state or 90 s elapse.
      const deadline = Date.now() + 90_000
      while (Date.now() < deadline) {
        const snap = await snapshotRide(api, ride.id)
        snapshots.push(snap)
        if (['ACCEPTED', 'CANCELLED', 'EXPIRED'].includes(snap.status)) break
        await new Promise(r => setTimeout(r, 2_000))
      }

      evidence.rideStatus = snapshots.at(-1)?.status

      // COUNT(PENDING) ≤ 1 at every observation.
      assertDispatchInvariant(snapshots, 'scenario-4')

      // Stage rank must be non-decreasing (no regression).
      const stageSequence = snapshots
        .map(s => s.dispatchStage)
        .filter((s): s is string => s !== null)

      let prevRank = -1
      for (const stage of stageSequence) {
        const rank = STAGE_RANK[stage] ?? prevRank
        expect.soft(
          rank,
          `Stage regression: '${stage}' (rank ${rank}) after rank ${prevRank}`,
        ).toBeGreaterThanOrEqual(prevRank)
        prevRank = rank
      }

      logTable(snapshots)
    } finally {
      evidence.extra = { snapshots }
      await attachSmokeEvidence(testInfo, evidence)
    }
  })
})
