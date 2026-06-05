import { apiRequest } from './api'
import type { PassengerNetwork, PassengerNetworkHierarchy } from '../types'

export async function getPassengerNetwork(passengerId: string): Promise<PassengerNetwork> {
  return apiRequest<PassengerNetwork>(`/passengers/${passengerId}/network`)
}

export async function getPassengerNetworkHierarchy(passengerId: string): Promise<PassengerNetworkHierarchy> {
  return apiRequest<PassengerNetworkHierarchy>(`/passengers/${passengerId}/network/hierarchy`)
}
