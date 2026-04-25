import axios from 'axios'
import type { CreateRidePayload, Passenger, Ride } from '../types'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function getPassenger(passengerId: string): Promise<Passenger> {
  const { data } = await api.get<Passenger>(`/passengers/${passengerId}`)
  return data
}

export async function createRide(
  payload: CreateRidePayload
): Promise<{ message: string; ride: Ride }> {
  const { data } = await api.post<{ message: string; ride: Ride }>(
    '/rides',
    payload
  )
  return data
}

export async function getRide(rideId: string): Promise<Ride> {
  const { data } = await api.get<Ride>(`/rides/${rideId}`)
  return data
}

export async function respondOffer(
  offerId: string,
  accept: boolean
): Promise<void> {
  await api.patch(`/offers/${offerId}/respond`, { accept })
}

export default api
