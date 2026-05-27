import type { Page } from '@playwright/test'

export type AuthStoragePayload = {
  role: 'driver' | 'passenger'
  userId: string
  email: string
  name: string
  driverId?: string
  passengerId?: string
  referralCode?: string
}

export function installAuthStorage(page: Page, params: AuthStoragePayload) {
  return page.addInitScript((payload: AuthStoragePayload) => {
    const auth = {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      ...(payload.driverId ? { driverId: payload.driverId } : {}),
      ...(payload.passengerId ? { passengerId: payload.passengerId } : {}),
      ...(payload.referralCode ? { referralCode: payload.referralCode } : {}),
    }

    localStorage.setItem('aliado:auth', JSON.stringify(auth))
    localStorage.setItem('aliado:token', 'e2e-token')

    if (payload.driverId) localStorage.setItem('driverId', payload.driverId)
    if (payload.passengerId) localStorage.setItem('passengerId', payload.passengerId)
  }, params)
}