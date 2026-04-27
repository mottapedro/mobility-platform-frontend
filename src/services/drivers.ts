import { api } from './api'
import type { DriverOffer, DriverRide } from '../types'

export interface DriverSummary {
  id: string
  name: string
  phone: string
}

export async function getDrivers(): Promise<DriverSummary[]> {
  const data = await api.get<{ value?: DriverSummary[] }>('/drivers')
  return data.value ?? []
}

export async function getDriverOffers(driverId: string): Promise<DriverOffer[]> {
  return api.get<DriverOffer[]>(`/drivers/${driverId}/offers`)
}

export async function getDriverRides(driverId: string): Promise<DriverRide[]> {
  return api.get<DriverRide[]>(`/drivers/${driverId}/rides`)
}
