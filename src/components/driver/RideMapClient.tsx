'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import { geocodeAddress } from '../../services/geocode'
import { calculateDistanceKm } from '../../utils/distance'
import { estimateETA } from '../../utils/eta'

// Fix Leaflet default icon paths broken by bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Fallback used only while geocoding is in progress or fails
const FALLBACK: { origin: [number, number]; destination: [number, number] } = {
  origin: [-22.9068, -43.1729],
  destination: [-22.9707, -43.1823],
}

type Coords = { origin: [number, number]; destination: [number, number] }

type Props = {
  origin: string
  destination: string
}

export default function RideMapClient({ origin, destination }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Cancel any in-flight geocoding when props change
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    async function load() {
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination),
      ])

      if (controller.signal.aborted) return
      if (!originCoords || !destCoords) return

      const o: [number, number] = [originCoords.lat, originCoords.lng]
      const d: [number, number] = [destCoords.lat, destCoords.lng]

      setCoords({ origin: o, destination: d })

      const dist = calculateDistanceKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng)
      setDistance(dist)
      setEta(estimateETA(dist))
    }

    load()

    return () => controller.abort()
  }, [origin, destination])

  // Use real coords when available; fall back to RJ center so the map is
  // never blank, but suppress markers/line/stats until geocoding resolves.
  const hasRealCoords = coords !== null
  const center = coords?.origin ?? FALLBACK.origin
  const originPos = coords?.origin ?? FALLBACK.origin
  const destPos = coords?.destination ?? FALLBACK.destination

  return (
    <div>
      <div className="overflow-hidden rounded-xl">
        <MapContainer
          key={`${originPos[0]}-${destPos[0]}`}
          center={center}
          zoom={hasRealCoords ? 13 : 11}
          scrollWheelZoom={false}
          style={{ height: '192px', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {hasRealCoords && (
            <>
              <Marker position={originPos} />
              <Marker position={destPos} />
              <Polyline
                positions={[originPos, destPos]}
                pathOptions={{ color: '#f97316', weight: 3, dashArray: '6 4' }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {hasRealCoords && distance !== null && eta !== null && (
        <p className="mt-2 text-xs text-zinc-400">
          {`Distância: ${distance.toFixed(2)} km • ETA: ${Math.round(eta)} min`}
        </p>
      )}

      {!hasRealCoords && (
        <p className="mt-2 text-xs text-zinc-500">
          Digite o endereço completo para ver a rota no mapa
        </p>
      )}
    </div>
  )
}
