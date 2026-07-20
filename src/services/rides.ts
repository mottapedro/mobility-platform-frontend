import { apiRequest } from './api'
import type { CreateRidePayload, Offer, Passenger, Ride, RideLocation } from '../types'

export interface CreatePassengerPayload {
  name: string
  email: string
  phone: string
  referredByDriverId?: string
}

export async function createPassenger(payload: CreatePassengerPayload): Promise<Passenger> {
  return apiRequest('/passengers', { method: 'POST', body: payload })
}

export async function createRide(
  payload: CreateRidePayload,
): Promise<{ message: string; ride: Ride }> {
  return apiRequest('/rides', { method: 'POST', body: payload })
}

export async function getRide(rideId: string): Promise<Ride> {
  return apiRequest(`/rides/${rideId}`)
}

export async function getRideLocation(rideId: string): Promise<RideLocation> {
  return apiRequest(`/trips/${rideId}/location`)
}

export async function getPendingRides(): Promise<Ride[]> {
  return apiRequest('/rides?status=pending')
}

export async function updateRide(
  rideId: string,
  body: Record<string, unknown>,
): Promise<void> {
  return apiRequest(`/rides/${rideId}`, { method: 'PATCH', body })
}

export async function getRidesByPassenger(passengerId: string): Promise<Ride[]> {
  return apiRequest(`/rides?passengerId=${passengerId}`)
}

export async function respondOffer(
  offerId: string,
  accept: boolean,
): Promise<void> {
  return apiRequest(`/offers/${offerId}/respond`, { method: 'PATCH', body: { accept } })
}

export async function getPassenger(passengerId: string): Promise<Passenger> {
  return apiRequest(`/passengers/${passengerId}`)
}

export async function getDriverOffers(driverId: string): Promise<Offer[]> {
  return apiRequest(`/drivers/${driverId}/offers`)
}
