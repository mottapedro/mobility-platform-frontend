import { API_URL } from '../config/api'
import { apiRequest } from './api'
import type { DriverNetwork, DriverNetworkHierarchy, DriverOffer, DriverRide } from '../types'

export interface DriverSummary {
  id: string
  name: string
  phone: string
  referralCode?: string
}

export interface DriverReferralProfile extends DriverSummary {
  slug: string
  avatarLabel: string
  regionLabel: string
  vehicleLabel: string
  ratingLabel: string
  headline: string
  phoneLabel: string
}

type DriverCollectionResponse = {
  value?: DriverSummary[]
  Count?: number
}

const REGION_LABELS: Record<string, string> = {
  zn: 'Zona Norte',
  zs: 'Zona Sul',
  zo: 'Zona Oeste',
  baixada: 'Baixada',
  inter: 'Interior',
}

function normalizeSlugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function serverHeaders(): HeadersInit | undefined {
  if (typeof window !== 'undefined') return undefined
  return { 'ngrok-skip-browser-warning': 'true' }
}

export function buildDriverSlug(name: string): string {
  return normalizeSlugPart(name)
}

export function formatDriverPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function getRegionLabelFromSlug(slug: string): string {
  const normalizedSlug = normalizeSlugPart(slug)
  const regionCode = normalizedSlug.split('-').at(-1)
  if (!regionCode) return 'Atendimento sob consulta'
  return REGION_LABELS[regionCode] ?? 'Atendimento sob consulta'
}

export function findDriverByReferralSlug(drivers: DriverSummary[], slug: string): DriverSummary | null {
  const normalizedSlug = normalizeSlugPart(slug)
  const exactMatch = drivers.find((driver) => buildDriverSlug(driver.name) === normalizedSlug)
  if (exactMatch) return exactMatch

  const prefixMatches = drivers.filter((driver) => normalizedSlug.startsWith(`${buildDriverSlug(driver.name)}-`))
  if (prefixMatches.length === 1) return prefixMatches[0]

  return null
}

export function toDriverReferralProfile(driver: DriverSummary, slug = buildDriverSlug(driver.name)): DriverReferralProfile {
  const avatarWords = driver.name.split(/\s+/).filter(Boolean)
  const avatarLabel = avatarWords
    .slice(0, 2)
    .map((word) => normalizeSlugPart(word).charAt(0).toUpperCase())
    .join('') || 'AL'

  return {
    ...driver,
    slug,
    avatarLabel,
    regionLabel: getRegionLabelFromSlug(slug),
    vehicleLabel: 'Veículo parceiro Aliado',
    ratingLabel: 'Em breve',
    headline: 'Atendimento concierge com contato humano e prioridade no seu agendamento.',
    phoneLabel: formatDriverPhone(driver.phone),
  }
}

export async function getDrivers(): Promise<DriverSummary[]> {
  const data = await apiRequest<DriverCollectionResponse | DriverSummary[]>('/drivers')
  return Array.isArray(data) ? data : data.value ?? []
}

export async function getDriverByReferralSlug(slug: string): Promise<DriverReferralProfile | null> {
  const response = await fetch(`${API_URL}/drivers`, {
    headers: {
      'Content-Type': 'application/json',
      ...serverHeaders(),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Erro ao carregar motorista')
  }

  const payload = (await response.json()) as DriverCollectionResponse | DriverSummary[]
  const drivers = Array.isArray(payload) ? payload : payload.value ?? []
  const driver = findDriverByReferralSlug(drivers, slug)

  return driver ? toDriverReferralProfile(driver, normalizeSlugPart(slug)) : null
}

export async function getDriverOffers(driverId: string): Promise<DriverOffer[]> {
  return apiRequest<DriverOffer[]>(`/drivers/${driverId}/offers`)
}

export async function getDriverRides(driverId: string): Promise<DriverRide[]> {
  return apiRequest<DriverRide[]>(`/drivers/${driverId}/rides`)
}

export async function getDriverNetwork(driverId: string): Promise<DriverNetwork> {
  return apiRequest<DriverNetwork>(`/drivers/${driverId}/network`)
}

export async function getDriverNetworkHierarchy(driverId: string): Promise<DriverNetworkHierarchy> {
  return apiRequest<DriverNetworkHierarchy>(`/drivers/${driverId}/network/hierarchy`)
}
