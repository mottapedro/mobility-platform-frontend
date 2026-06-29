import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Tipos globais do Google Maps em runtime
declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ''

export interface AddressSuggestion {
  displayName: string
  placeId?: string
  lat?: number
  lng?: number
  postalCode?: string
  streetNumber?: string
  streetName?: string
  neighborhood?: string
  city?: string
}

interface GooglePlaceResult {
  address_components: Array<{
    types: string[]
    long_name: string
    short_name: string
  }>
  geometry: {
    location: { lat: () => number; lng: () => number }
  }
  formatted_address: string
}

type Coords = { lat: number; lng: number }

// Simple in-memory cache to avoid hammering Google on re-renders
const cache = new Map<string, Coords | null>()
const suggestCache = new Map<string, AddressSuggestion[]>()
const placeCache = new Map<string, GooglePlaceResult>()

let loaderPromise: Promise<void> | null = null
let placesLib: any = null
let loaderConfigured = false

async function ensureGoogleMapsLoaded() {
  if (!loaderPromise) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error(
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada nas variáveis de ambiente.',
      )
    }

    if (!loaderConfigured) {
      setOptions({
        key: GOOGLE_MAPS_API_KEY,
        libraries: ['places', 'geocoding'],
        ...(GOOGLE_MAPS_ID ? { id: GOOGLE_MAPS_ID } : {}),
      })
      loaderConfigured = true
    }

    placesLib = await importLibrary('places')
    loaderPromise = Promise.resolve()
  }
  return loaderPromise
}

export async function geocodeAddress(address: string): Promise<Coords | null> {
  const trimmed = address.trim()
  if (trimmed.length < 5) {
    console.warn('[geocodeAddress] Endereço muito curto:', trimmed)
    return null
  }

  const key = trimmed.toLowerCase()
  if (cache.has(key)) {
    const cached = cache.get(key)
    console.log('[geocodeAddress] Cache hit para:', trimmed, 'result:', cached)
    return cached ?? null
  }

  try {
    await ensureGoogleMapsLoaded()

    const geocoding: any = await importLibrary('geocoding')
    const geocoder = new geocoding.Geocoder()
    const res = await new Promise<any[]>((resolve, reject) => {
      geocoder.geocode(
        { address: `${trimmed}, Brasil` },
        (results: any[], status: string) => {
          if ((status as string) !== 'OK' || !(results as any[])?.length) {
            reject(new Error(`Geocoding failed: ${status}`))
            return
          }
          resolve(results as any[])
        },
      )
    })

    const location = res[0].geometry.location
    const coords = { lat: location.lat(), lng: location.lng() }
    cache.set(key, coords)
    console.log('[geocodeAddress] Sucesso para:', trimmed, coords)
    return coords
  } catch (err) {
    console.error('[geocodeAddress] Falha para:', trimmed, err)
    cache.set(key, null)
    return null
  }
}

export async function searchAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const key = trimmed.toLowerCase()
  if (suggestCache.has(key)) return suggestCache.get(key)!

  try {
    await ensureGoogleMapsLoaded()

    const { AutocompleteSuggestion } = placesLib

    const sessionToken = new placesLib.AutocompleteSessionToken()
    const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: trimmed,
      sessionToken,
    })

    // A nova API pode retornar { predictions: [...] } ou um array diretamente
    const items = Array.isArray(response)
      ? response
      : (response as any)?.predictions ?? (response as any)?.suggestions ?? []

    const mapped: AddressSuggestion[] = items
      .filter((item: any) => {
        const types: string[] = item.placePrediction?.types ?? []
        const text: string = item.placePrediction?.text?.text ?? ''
        return types.includes('address') || text.length > 5
      })
      .map((item: any) => {
        const pp = item.placePrediction
        const coords: { lat?: number; lng?: number } = {}
        const loc = pp?.location
        if (loc) {
          if (typeof loc.lat === 'function') coords.lat = loc.lat()
          else if (typeof loc.lat === 'number') coords.lat = loc.lat
          if (typeof loc.lng === 'function') coords.lng = loc.lng()
          else if (typeof loc.lng === 'number') coords.lng = loc.lng
        }
        return {
          placeId: pp.placeId,
          displayName: pp.text.text,
          ...coords,
        } as AddressSuggestion
      })

    suggestCache.set(key, mapped)
    return mapped
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    if (msg.includes('blocked') || msg.includes('REQUEST_DENIED') || msg.includes('not authorized')) {
      console.error('[Google Maps API Error]: A Places API não está habilitada ou a chave está restrita. Habilite Places API e Maps JavaScript API no Google Cloud Console.')
    } else {
      console.error('[Google Maps API Error]:', err)
    }
    return []
  }
}

export async function getPlaceDetails(
  placeId: string,
): Promise<Omit<AddressSuggestion, 'placeId'> | null> {
  if (placeCache.has(placeId)) {
    const cached = placeCache.get(placeId)!
    return parsePlaceResult(cached)
  }

  try {
    await ensureGoogleMapsLoaded()

    const service = new placesLib.PlacesService(
      document.createElement('div'),
    )
    const res = await new Promise<GooglePlaceResult | null>((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['address_components', 'geometry', 'formatted_address'] as any,
        },
        (place: any, status: string) => {
          if (status !== 'OK' || !place) {
            resolve(null)
            return
          }
          resolve(place as GooglePlaceResult)
        },
      )
    })

    if (!res) return null

    placeCache.set(placeId, res)
    return parsePlaceResult(res)
  } catch {
    return null
  }
}

function parsePlaceResult(
  place: GooglePlaceResult,
): Omit<AddressSuggestion, 'placeId'> {
  const components: Record<string, string> = {}
  for (const c of place.address_components) {
    for (const t of c.types) {
      components[t] = c.long_name
    }
  }

  const streetName = components.route || components.premise || ''
  const streetNumber = components.street_number || ''
  const neighborhood = components.neighborhood || components.sublocality || ''
  const city = components.locality || components.administrative_area_level_2 || ''
  const postalCode = components.postal_code || ''

  // Monta endereço completo com número quando disponível
  let displayName = place.formatted_address
  if (streetName && streetNumber) {
    displayName = `${streetName} ${streetNumber}${neighborhood ? ', ' + neighborhood : ''}${city ? ', ' + city : ''}${postalCode ? ' - ' + postalCode : ''}`
  }

  return {
    displayName,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    postalCode,
    streetNumber,
    streetName,
    neighborhood,
    city,
  }
}
export { placesLib as googleMapsPlaces }