type Coords = { lat: number; lng: number }
type NominatimResult = { lat: string; lon: string; display_name: string }

// Append region context so Nominatim doesn't return results from outside Brazil
const BASE_REGION = 'Rio de Janeiro, Brasil'

// Simple in-memory cache to avoid hammering Nominatim on re-renders
const cache = new Map<string, Coords | null>()

export async function geocodeAddress(address: string): Promise<Coords | null> {
  const trimmed = address.trim()

  // Reject inputs too short to produce a meaningful geocode
  if (trimmed.length < 5) return null

  const fullQuery = `${trimmed}, ${BASE_REGION}`
  const key = fullQuery.toLowerCase()

  if (cache.has(key)) return cache.get(key)!

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`,
      {
        headers: {
          // Nominatim requires a descriptive User-Agent
          'User-Agent': 'mobility-platform-frontend/1.0',
        },
      }
    )

    if (!res.ok) {
      cache.set(key, null)
      return null
    }

    const data: NominatimResult[] = await res.json()

    // Discard results outside Brazil to avoid stray global coordinates
    if (!data.length || !data[0].display_name.includes('Brasil')) {
      cache.set(key, null)
      return null
    }

    const coords: Coords = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }

    cache.set(key, coords)
    return coords
  } catch {
    cache.set(key, null)
    return null
  }
}
