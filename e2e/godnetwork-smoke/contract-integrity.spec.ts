import { test, expect } from '@playwright/test'
import { SmokeApi } from '../smoke/support/api'
import { loadSmokeEnv } from '../smoke/support/env'

// Contract integrity tests verify the backend API response shapes without
// requiring direct database access. All assertions are over HTTP.

const env = loadSmokeEnv()

let api: SmokeApi
let driver: Awaited<ReturnType<SmokeApi['loginDriver']>>
let passenger: Awaited<ReturnType<SmokeApi['loginPassenger']>>

test.describe('Contract Integrity — HTTP API response shapes', () => {
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

  test('GET /network/context — responde com os campos obrigatórios do contrato Aliado V2', async () => {
    const body = await api.rawGet(
      '/network/context',
      { actorId: driver.driverId, actorType: 'driver' },
      { 'x-driver-id': driver.driverId },
    ) as Record<string, unknown>

    console.log('[contract] network context fields:', Object.keys(body).join(', '))

    // Required top-level contract fields (Aliado V2 raw API shape).
    expect(body).toHaveProperty('flowType')
    expect(body).toHaveProperty('genealogy')
    expect(body).toHaveProperty('inviteUrls')
    expect(body).toHaveProperty('capabilities')
  })

  test('POST /rides + GET /rides/:id — resposta inclui status e currentDispatchStage', async () => {
    // scheduledAt 90 h ahead — distinct from dispatch-lifecycle (72/74/76/78 h).
    const scheduledAt = new Date(Date.now() + 90 * 60 * 60_000).toISOString()
    const ride = await api.createRideOrReclaim(
      { passengerId: passenger.passengerId, origin: env!.originAddress, destination: env!.destinationAddress, scheduledAt },
      passenger.token,
    )
    createdRideId = ride.id

    // POST /rides must return id and status.
    expect(ride.id, 'POST /rides must return ride id').toBeTruthy()
    expect(ride.status, 'POST /rides must return ride status').toBeTruthy()

    // GET /rides/:id must return currentDispatchStage field.
    const body = await api.rawGet(`/rides/${ride.id}`) as Record<string, unknown>

    console.log(`[contract] ride fields: ${Object.keys(body).join(', ')}`)
    console.log(`[contract] ride status=${body['status']} dispatchStage=${body['currentDispatchStage'] ?? '(null)'}`)

    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('status')
    // currentDispatchStage may be null for a newly created ride, but the key
    // must be present in the response (contract requirement).
    expect(
      Object.prototype.hasOwnProperty.call(body, 'currentDispatchStage'),
      'GET /rides/:id must include currentDispatchStage in response',
    ).toBe(true)
  })
})
