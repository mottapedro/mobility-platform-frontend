import { apiRequest } from './api'
import type { PassengerNetwork, PassengerNetworkHierarchy } from '../types'

function normalizeSlugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildPassengerReferralSlug(name: string): string {
  return normalizeSlugPart(name)
}

export async function getPassengerNetwork(passengerId: string): Promise<PassengerNetwork> {
  return apiRequest<PassengerNetwork>(`/passengers/${passengerId}/network`)
}

export async function getPassengerNetworkHierarchy(passengerId: string): Promise<PassengerNetworkHierarchy> {
  return apiRequest<PassengerNetworkHierarchy>(`/passengers/${passengerId}/network/hierarchy`)
}
