import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'

test('pix payment: passenger creates ride → driver accepts → invoice (PIX) renders with real backend data', async ({ actors }, testInfo) => {
  const { api, env, passengerSession, driverSession, passengerPage } = actors
  const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
    driverId: driverSession.driverId,
    passengerId: passengerSession.passengerId,
  }

  try {
    // 1. Passageiro cria a corrida via API (equivalente ao POST /rides do fluxo manual)
    // Horário espalhado em dias (não minutos) para não colidir com corridas de execuções anteriores.
    const scheduledAt = new Date(Date.now() + (2 + Math.random() * 5) * 24 * 60 * 60_000).toISOString()
    const ride = await api.createRideOrReclaim(
      {
        passengerId: passengerSession.passengerId,
        origin: env.originAddress,
        destination: env.destinationAddress,
        scheduledAt,
        originLat: env.geo.latitude,
        originLng: env.geo.longitude,
        destinationLat: env.geo.latitude + 0.01,
        destinationLng: env.geo.longitude + 0.01,
      },
      passengerSession.token,
    )
    evidence.rideId = ride.id

    // 2. Motorista recebe e aceita a oferta (necessário para o botão "Pagar via PIX" aparecer)
    const offer = await api.waitForOfferForRide(driverSession.driverId, ride.id)
    evidence.offerId = offer.id
    await api.respondOffer(offer.id, true)
    const accepted = await api.waitForRideStatus(ride.id, (r) => r.status === 'ACCEPTED')
    evidence.rideStatus = accepted.status
    evidence.selectedDriverId = accepted.selectedDriverId

    // 3. Passageiro abre "Minhas corridas" com a corrida no cache local
    await passengerPage.goto('/passenger/rides')
    await passengerPage.evaluate((rideId) => {
      localStorage.setItem('passengerRideIds', JSON.stringify([rideId]))
    }, ride.id)
    await passengerPage.reload()

    // 4. Clica em "Pagar via PIX" e valida a fatura renderizada com dados reais do backend
    await passengerPage.getByRole('button', { name: /Pagar via PIX/i }).click()

    const dialog = passengerPage.getByRole('dialog', { name: /Pagar via PIX/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Total a pagar/i)).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByRole('button', { name: /copiar/i })).toBeVisible()

  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
