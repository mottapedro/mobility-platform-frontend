import { expect, test } from '@playwright/test'
import { installAuthStorage, type AuthStoragePayload } from './support/authStorage'
import { stubDriverGenealogy, stubDriverNetworkContext } from './support/networkRouteStubs'

test('driver network bootstraps with shared auth storage helper', async ({ page }) => {
  await stubDriverNetworkContext(page)
  await stubDriverGenealogy(page)

  const payload: AuthStoragePayload = {
    role: 'driver',
    userId: 'u-driver-auth',
    email: 'driver-auth@test.com',
    name: 'Driver Auth',
    driverId: 'drv-1',
    referralCode: 'driver-auth-ref',
  }

  await installAuthStorage(page, payload)
  await page.goto('/driver/network?tab=drivers')

  await expect(page.getByTestId('network-experience')).toBeVisible()

  const storedAuth = await page.evaluate(() => localStorage.getItem('aliado:auth'))
  const storedDriverId = await page.evaluate(() => localStorage.getItem('driverId'))

  expect(storedAuth).toContain('u-driver-auth')
  expect(storedAuth).toContain('driver-auth@test.com')
  expect(storedDriverId).toBe('drv-1')
})