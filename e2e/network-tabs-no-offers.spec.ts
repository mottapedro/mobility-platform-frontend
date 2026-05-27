import { expect, test } from '@playwright/test'
import { installAuthStorage } from './support/authStorage'
import {
  tryFulfillDriverGenealogy,
  tryFulfillDriverNetworkContext,
  tryFulfillPassengerNetworkContext,
} from './support/networkRouteStubs'

type Phase = 'bootstrap' | 'tab-interaction'

test.describe('Network tabs should not trigger operational API calls', () => {
  test('driver network tabs do not call /drivers/:id/offers or /drivers/:id/rides', async ({ page }, testInfo) => {
    let phase: Phase = 'bootstrap'
    const operationalApiHits: string[] = []
    const routePrefetchHits: string[] = []

    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = request.url()
      let pathname = ''
      let searchParams = new URLSearchParams()

      try {
        const parsed = new URL(url)
        pathname = parsed.pathname
        searchParams = parsed.searchParams
      } catch {
        pathname = url
      }

      if (await tryFulfillDriverNetworkContext(route, { pathname, searchParams })) {
        return
      }

      if (await tryFulfillDriverGenealogy(route, { pathname, searchParams })) {
        return
      }

      if (/\/drivers\/[^/]+\/(offers|rides)(?:\?.*)?$/.test(pathname) && phase === 'tab-interaction') {
        operationalApiHits.push(pathname)
      }

      if (/^\/driver\/(offers|rides)$/.test(pathname) && phase === 'tab-interaction') {
        routePrefetchHits.push(pathname)
      }

      await route.continue()
    })

    await installAuthStorage(page, {
      role: 'driver',
      userId: 'u-driver',
      email: 'driver@test.com',
      name: 'Driver User',
      driverId: 'drv-1',
      referralCode: 'driver-ref',
    })

    await page.goto('/driver/network?tab=drivers')

    await expect(page.getByTestId('network-experience')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Social' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Árvore' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lateral' })).toBeVisible()

    phase = 'tab-interaction'

    await page.getByRole('button', { name: 'Social' }).click()
    await page.getByRole('button', { name: 'Árvore' }).click()
    await page.getByRole('button', { name: 'Lateral' }).click()
    await page.waitForTimeout(300)

    await testInfo.attach('driver-network-spy', {
      body: JSON.stringify({ operationalApiHits, routePrefetchHits }, null, 2),
      contentType: 'application/json',
    })

    expect(operationalApiHits).toEqual([])
  })

  test('passenger network tabs do not call /drivers/:id/offers or /drivers/:id/rides', async ({ page }, testInfo) => {
    let phase: Phase = 'bootstrap'
    const operationalApiHits: string[] = []
    const routePrefetchHits: string[] = []

    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = request.url()
      let pathname = ''
      let searchParams = new URLSearchParams()

      try {
        const parsed = new URL(url)
        pathname = parsed.pathname
        searchParams = parsed.searchParams
      } catch {
        pathname = url
      }

      if (await tryFulfillPassengerNetworkContext(route, { pathname, searchParams })) {
        return
      }

      if (/\/drivers\/[^/]+\/(offers|rides)(?:\?.*)?$/.test(pathname) && phase === 'tab-interaction') {
        operationalApiHits.push(pathname)
      }

      if (/^\/driver\/(offers|rides)$/.test(pathname) && phase === 'tab-interaction') {
        routePrefetchHits.push(pathname)
      }

      await route.continue()
    })

    await installAuthStorage(page, {
      role: 'passenger',
      userId: 'u-passenger',
      email: 'passenger@test.com',
      name: 'Passenger User',
      passengerId: 'psg-1',
      referralCode: 'passenger-ref',
    })

    await page.goto('/passenger/network')

    await expect(page.getByTestId('network-experience')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Social' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Operacional' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lateral' })).toBeVisible()

    phase = 'tab-interaction'

    await page.getByRole('button', { name: 'Social' }).click()
    await page.getByRole('button', { name: 'Operacional' }).click()
    await page.getByRole('button', { name: 'Lateral' }).click()
    await page.waitForTimeout(300)

    await testInfo.attach('passenger-network-spy', {
      body: JSON.stringify({ operationalApiHits, routePrefetchHits }, null, 2),
      contentType: 'application/json',
    })

    expect(operationalApiHits).toEqual([])
  })
})
