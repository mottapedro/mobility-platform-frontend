import { API_URL } from '../config/api'
import { apiRequest } from './api'
import type { DriverNetwork, DriverNetworkHierarchy, DriverNetworkPassenger, DriverOffer, DriverRide } from '../types'
import { assertDriverId } from '../utils/driverId'

export interface DriverSummary {
  id: string
  name: string
  phone: string
  referralCode?: string
  publicSlug?: string
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

  // 1. Match on publicSlug from backend (highest priority — supports custom slugs)
  const publicSlugMatch = drivers.find((driver) => driver.publicSlug === normalizedSlug)
  if (publicSlugMatch) return publicSlugMatch

  // 2. Match on name-derived slug (exact)
  const exactMatch = drivers.find((driver) => buildDriverSlug(driver.name) === normalizedSlug)
  if (exactMatch) return exactMatch

  // 3. Match by prefix (name slug is a prefix of the full slug)
  const prefixMatches = drivers.filter((driver) => normalizedSlug.startsWith(`${buildDriverSlug(driver.name)}-`))
  if (prefixMatches.length === 1) return prefixMatches[0]

  return null
}

export function toDriverReferralProfile(driver: DriverSummary, slug = driver.publicSlug ?? buildDriverSlug(driver.name)): DriverReferralProfile {
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
  const safeDriverId = assertDriverId(driverId)
  return apiRequest<DriverOffer[]>(`/drivers/${safeDriverId}/offers`)
}

export interface DriverMeProfile {
  driverId: string
  name: string
  email: string
  phone: string | null
  referralCode: string | null
  publicSlug: string | null
  networkLevel: number
  experienceLevel: string
  regions: string[]
}

/**
 * Perfil do motorista autenticado via Bearer (GET /drivers/me).
 * O token é injetado automaticamente pelo apiRequest a partir de
 * `aliado:token` — nunca usa x-driver-id.
 */
export async function getDriverMe(): Promise<DriverMeProfile> {
  return apiRequest<DriverMeProfile>('/drivers/me')
}

export interface DriverOperationalBase {
  id: string
  driverId: string
  formattedAddress: string
  providerPlaceId: string | null
  latitude: number
  longitude: number
  updatedAt: string
}

export type OperationalBaseUpdateInput = {
  formattedAddress: string
  providerPlaceId: string
}

type OperationalBaseGetResponse = {
  operationalBase: DriverOperationalBase | null
}

type OperationalBasePutResponse = {
  operationalBase: DriverOperationalBase
  source: 'GOOGLE_PLACE_DETAILS' | 'CLIENT_FALLBACK'
}

/**
 * Base operacional do motorista autenticado (GET /drivers/me/operational-base).
 * Bearer-only: o token é injetado pelo apiRequest via `aliado:token`.
 * 200 com operationalBase null significa "ainda não configurada" (estado NO_BASE).
 */
export async function getDriverOperationalBase(): Promise<DriverOperationalBase | null> {
  const response = await apiRequest<OperationalBaseGetResponse>(
    '/drivers/me/operational-base',
  )
  return response.operationalBase
}

/**
 * Cria/atualiza a base operacional (PUT /drivers/me/operational-base).
 * Envia APENAS formattedAddress + providerPlaceId — nunca lat/lng: o backend
 * resolve as coordenadas autoritativas via Google Place Details.
 */
export async function updateDriverOperationalBase(
  input: OperationalBaseUpdateInput,
): Promise<DriverOperationalBase> {
  if (!input.providerPlaceId || !input.providerPlaceId.trim()) {
    throw new Error('providerPlaceId é obrigatório — selecione uma sugestão do Google Places')
  }
  const response = await apiRequest<OperationalBasePutResponse>(
    '/drivers/me/operational-base',
    { method: 'PUT', body: input },
  )
  return response.operationalBase
}

export async function getDriverRides(driverId: string): Promise<DriverRide[]> {
  const safeDriverId = assertDriverId(driverId)
  return apiRequest<DriverRide[]>(`/drivers/${safeDriverId}/rides`)
}

/**
 * Normalises the raw backend response into the DriverNetwork shape.
 * Handles multiple known backend formats:
 *   - { totalPassengers, ridesCompleted, estimatedRevenue, recentPassengers }  (expected)
 *   - { totalPassengers, ridesCompleted, estimatedRevenue, passengers }         (alt key)
 *   - { data: { ... } }                                                         (wrapped envelope)
 *   - unrecognised shape → defaults apply (recentPassengers: [], counts: 0)
 */
function normalizeDriverNetwork(raw: unknown): DriverNetwork {
  if (!raw || typeof raw !== 'object') {
    return { totalPassengers: 0, ridesCompleted: 0, estimatedRevenue: 0, recentPassengers: [] }
  }

  // Unwrap { data: { ... } } envelope
  const body = (raw as Record<string, unknown>).data && typeof (raw as Record<string, unknown>).data === 'object'
    ? (raw as Record<string, unknown>).data as Record<string, unknown>
    : raw as Record<string, unknown>

  const recentPassengers = Array.isArray(body.recentPassengers)
    ? body.recentPassengers
    : Array.isArray(body.passengers)
      ? body.passengers
      : []

  return {
    totalPassengers: typeof body.totalPassengers === 'number' ? body.totalPassengers : (recentPassengers as unknown[]).length,
    ridesCompleted: typeof body.ridesCompleted === 'number' ? body.ridesCompleted : 0,
    estimatedRevenue: typeof body.estimatedRevenue === 'number' ? body.estimatedRevenue : 0,
    recentPassengers: recentPassengers as DriverNetworkPassenger[],
  }
}

export async function getDriverNetwork(driverId: string): Promise<DriverNetwork> {
  const safeDriverId = assertDriverId(driverId)
  const raw = await apiRequest<unknown>(`/drivers/${safeDriverId}/network`)
  const normalized = normalizeDriverNetwork(raw)
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[getDriverNetwork] raw:', raw, '→ normalized:', normalized)
  }
  return normalized
}

export async function getDriverNetworkHierarchy(driverId: string): Promise<DriverNetworkHierarchy> {
  const safeDriverId = assertDriverId(driverId)
  return apiRequest<DriverNetworkHierarchy>(`/drivers/${safeDriverId}/network/hierarchy`)
}
