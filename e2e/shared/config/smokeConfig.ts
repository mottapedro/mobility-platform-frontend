function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required smoke env: ${name}`)
  }
  return value
}

export const smokeConfig = {
  apiUrl: requireEnv('SMOKE_API_URL'),
  driverEmail: requireEnv('SMOKE_DRIVER_EMAIL'),
  driverPassword: requireEnv('SMOKE_DRIVER_PASSWORD'),
  passengerEmail: requireEnv('SMOKE_PASSENGER_EMAIL'),
  passengerPassword: requireEnv('SMOKE_PASSENGER_PASSWORD'),
}
