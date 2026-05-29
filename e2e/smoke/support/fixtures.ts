import { test as base, Browser, BrowserContext, Page, chromium } from '@playwright/test'
import { installAuthStorage } from '../../support/authStorage'
import { SmokeApi, LoginDriverResult, LoginPassengerResult } from './api'
import { SmokeEnv, requireSmokeEnv } from './env'

export interface SmokeActors {
  env: SmokeEnv
  api: SmokeApi
  passengerSession: LoginPassengerResult
  driverSession: LoginDriverResult
  passengerPage: Page
  driverPage: Page
  passengerContext: BrowserContext
  driverContext: BrowserContext
}

async function buildPassengerPage(
  browser: Browser,
  env: SmokeEnv,
  session: LoginPassengerResult
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: env.passengerBaseUrl,
    permissions: ['geolocation'],
    geolocation: env.geo,
    locale: 'pt-BR',
  })
  const page = await context.newPage()
  await installAuthStorage(page, {
    role: 'passenger',
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    passengerId: session.passengerId,
  })
  return { context, page }
}

async function buildDriverPage(
  browser: Browser,
  env: SmokeEnv,
  session: LoginDriverResult
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: env.driverBaseUrl,
    permissions: ['geolocation'],
    geolocation: env.geo,
    locale: 'pt-BR',
    extraHTTPHeaders: { 'x-driver-id': session.driverId },
  })
  const page = await context.newPage()
  await installAuthStorage(page, {
    role: 'driver',
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    driverId: session.driverId,
    referralCode: session.referralCode,
  })
  return { context, page }
}

export const test = base.extend<{ actors: SmokeActors }>({
  actors: async ({ browser }, use) => {
    const env = requireSmokeEnv()
    const api = await SmokeApi.create(env.apiUrl)
    const passengerSession = await api.loginPassenger(env.passengerEmail, env.passengerPassword)
    const driverSession = await api.loginDriver(env.driverEmail, env.driverPassword)

    // Passenger uses the project browser (Chromium). Driver uses real Chrome to mirror prod usage.
    const driverBrowser: Browser = await chromium.launch({ channel: 'chrome' })

    const passenger = await buildPassengerPage(browser, env, passengerSession)
    const driver = await buildDriverPage(driverBrowser, env, driverSession)

    await use({
      env,
      api,
      passengerSession,
      driverSession,
      passengerPage: passenger.page,
      driverPage: driver.page,
      passengerContext: passenger.context,
      driverContext: driver.context,
    })

    await passenger.context.close()
    await driver.context.close()
    await driverBrowser.close()
    await api.dispose()
  },
})

export const expect = test.expect
