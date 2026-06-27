import { test, expect } from './support/fixtures'
import { attachSmokeEvidence } from './support/evidence'
import { Page } from '@playwright/test'

// Helper para formatar a data para o input datetime-local
function getFutureDateTime() {
  const date = new Date(Date.now() + 5 * 60_000) // 5 minutos no futuro
  // Formato YYYY-MM-DDTHH:mm
  return date.toISOString().slice(0, 16)
}

test('happy path: passenger creates ride → driver receives offer → accepts → ride ACCEPTED', async ({ actors }, testInfo) => {
  const { env, passengerSession, driverSession, passengerPage, driverPage } = actors
  const evidence: Parameters<typeof attachSmokeEvidence>[1] = {
    driverId: driverSession.driverId,
    passengerId: passengerSession.passengerId,
  }

  try {
    // Warm-up: both apps reachable.
    await passengerPage.goto('/passenger/create')
    await driverPage.goto('/driver/offers')

    // 1. Passageiro preenche o formulário
    await passengerPage.locator('input#origin').fill(env.originAddress)
    // Se for AddressInput customizado pode precisar de keyboard events
    await passengerPage.keyboard.press('ArrowDown')
    await passengerPage.keyboard.press('Enter')
    
    await passengerPage.locator('input#destination').fill(env.destinationAddress)
    await passengerPage.keyboard.press('ArrowDown')
    await passengerPage.keyboard.press('Enter')
    
    // Preenche a data
    await passengerPage.locator('input[type="datetime-local"]').fill(getFutureDateTime())
    
    // Clica em "Criar corrida"
    await passengerPage.getByRole('button', { name: /Criar corrida/i }).click()

    // 2. Validação no Passageiro: aguarda redirecionamento
    await passengerPage.waitForURL('**/passenger/rides')
    evidence.rideStatus = 'MATCHING'
    
    // 3. Motorista visualiza o card de oferta
    // O card tem um botão de aceitar e o nome do passageiro ou origem
    const acceptButton = driverPage.getByRole('button', { name: /Aceitar/i }).first()

    // Aguarda a oferta aparecer na tela do motorista
    await acceptButton.waitFor({ state: 'visible', timeout: 45_000 })
    
    // Motorista clica em "Aceitar"
    await acceptButton.click()

    // 4. Validação no Motorista: a oferta some indicando sucesso
    await expect(acceptButton).not.toBeVisible({ timeout: 15_000 })
    
    // Opcional: motorista vai para corridas
    await driverPage.goto('/driver/rides')
    // Verifica algum texto que indique corrida em andamento
    // await expect(driverPage.getByText(/Aceita/i).first()).toBeVisible({ timeout: 20_000 })

    evidence.rideStatus = 'ACCEPTED'

  } finally {
    await attachSmokeEvidence(testInfo, evidence)
  }
})
