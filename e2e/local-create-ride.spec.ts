import { test, expect } from '@playwright/test'
import { SmokeApi } from './smoke/support/api'

test.describe('Local Create Ride E2E', () => {
  test('deve criar corrida (API direta) se backend estiver up', async () => {
    const api = await SmokeApi.create('http://localhost:3000')

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60_000).toISOString()
    const ride = await api.createRideOrReclaim({
      passengerId: '23be9b9c-bcc7-4d1b-9b9f-53ac309d99dc',
      origin: 'Rua Barão de São Borja 68, Méier',
      destination: 'Aeroporto Galeão',
      scheduledAt,
      originLat: -23.5613,
      originLng: -46.6565,
      destinationLat: -23.5631,
      destinationLng: -46.6543,
    }, 'eyJhbGciOiJIUzI1NiJ9')

    expect(ride.id).toBeTruthy()
    console.log('[LOCAL-E2E] ride criada:', ride)
  })
})
