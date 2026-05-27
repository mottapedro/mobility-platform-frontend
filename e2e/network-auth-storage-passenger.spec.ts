import { expect, test } from '@playwright/test'
import { installAuthStorage, type AuthStoragePayload } from './support/authStorage'
import { stubPassengerNetworkContext } from './support/networkRouteStubs'

test('passenger network bootstraps with shared auth storage helper', async ({ page }) => {
  await stubPassengerNetworkContext(page)

  const payload: AuthStoragePayload = {
    role: 'passenger',
    userId: 'u-passenger-auth',
    email: 'passenger-auth@test.com',
    name: 'Passenger Auth',
    passengerId: 'psg-1',
    referralCode: 'passenger-auth-ref',
  }

  await installAuthStorage(page, payload)
  await page.goto('/passenger/network')

  await expect(page.getByTestId('network-experience')).toBeVisible()

  const storedAuth = await page.evaluate(() => localStorage.getItem('aliado:auth'))
  const storedPassengerId = await page.evaluate(() => localStorage.getItem('passengerId'))

  expect(storedAuth).toContain('u-passenger-auth')
  expect(storedAuth).toContain('passenger-auth@test.com')
  expect(storedPassengerId).toBe('psg-1')
})