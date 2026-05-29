import { test } from '@playwright/test'

export interface SmokeEnv {
  apiUrl: string
  passengerBaseUrl: string
  driverBaseUrl: string
  passengerEmail: string
  passengerPassword: string
  driverEmail: string
  driverPassword: string
  originAddress: string
  destinationAddress: string
  geo: { latitude: number; longitude: number }
}

function required(name: string): string | null {
  const v = process.env[name]
  return v && v.trim() !== '' ? v : null
}

export function loadSmokeEnv(): SmokeEnv | null {
  const apiUrl = required('SMOKE_API_URL')
  const passengerEmail = required('SMOKE_PASSENGER_EMAIL')
  const passengerPassword = required('SMOKE_PASSENGER_PASSWORD')
  const driverEmail = required('SMOKE_DRIVER_EMAIL')
  const driverPassword = required('SMOKE_DRIVER_PASSWORD')

  if (!apiUrl || !passengerEmail || !passengerPassword || !driverEmail || !driverPassword) {
    return null
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    passengerBaseUrl: (required('SMOKE_PASSENGER_URL') ?? apiUrl).replace(/\/$/, ''),
    driverBaseUrl: (required('SMOKE_DRIVER_URL') ?? apiUrl).replace(/\/$/, ''),
    passengerEmail,
    passengerPassword,
    driverEmail,
    driverPassword,
    originAddress: required('SMOKE_ORIGIN') ?? 'Av. Paulista, 1000, São Paulo',
    destinationAddress: required('SMOKE_DESTINATION') ?? 'Av. Brigadeiro Faria Lima, 3477, São Paulo',
    geo: {
      latitude: Number(required('SMOKE_GEO_LAT') ?? '-23.5613'),
      longitude: Number(required('SMOKE_GEO_LNG') ?? '-46.6565'),
    },
  }
}

export function requireSmokeEnv(): SmokeEnv {
  const env = loadSmokeEnv()
  test.skip(!env, 'Smoke env not configured. Set SMOKE_API_URL + SMOKE_{PASSENGER,DRIVER}_{EMAIL,PASSWORD}.')
  return env as SmokeEnv
}
