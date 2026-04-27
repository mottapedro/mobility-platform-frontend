import { api } from './api'
import type { CreateRidePayload, Offer, Passenger, Ride } from '../types'

export interface CreatePassengerPayload {
  name: string
  email: string
  phone: string
  referredByDriverId?: string
}

export async function createPassenger(payload: CreatePassengerPayload): Promise<Passenger> {
  return api.post('/passengers', payload)
}

export async function createRide(
  payload: CreateRidePayload,
): Promise<{ message: string; ride: Ride }> {
  return api.post('/rides', payload)
}

export async function getRide(rideId: string): Promise<Ride> {
  return api.get(`/rides/${rideId}`)
}

export async function getPendingRides(): Promise<Ride[]> {
  return api.get('/rides?status=pending')
}

export async function updateRide(
  rideId: string,
  body: Record<string, unknown>,
): Promise<void> {
  return api.patch(`/rides/${rideId}`, body)
}

export async function getRidesByPassenger(passengerId: string): Promise<Ride[]> {
  return api.get(`/rides?passengerId=${passengerId}`)
}

export async function respondOffer(
  offerId: string,
  accept: boolean,
): Promise<void> {
  return api.patch(`/offers/${offerId}/respond`, { accept })
}

export async function getPassenger(passengerId: string): Promise<Passenger> {
  return api.get(`/passengers/${passengerId}`)
}

export async function getDriverOffers(driverId: string): Promise<Offer[]> {
  return api.get(`/drivers/${driverId}/offers`)
}
