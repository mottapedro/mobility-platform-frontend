'use client'

import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ''

export interface MapTrackerPosition {
  lat: number
  lng: number
  heading?: number | null
}

type Props = {
  position: MapTrackerPosition | null
}

let loaderConfigured = false

export function MapTracker({ position }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Initializes the map lazily, once the first GPS fix arrives.
  useEffect(() => {
    if (!position || mapRef.current || !containerRef.current) return

    if (!GOOGLE_MAPS_API_KEY) {
      setStatus('error')
      return
    }

    let cancelled = false

    async function init() {
      try {
        if (!loaderConfigured) {
          setOptions({
            key: GOOGLE_MAPS_API_KEY,
            libraries: ['maps', 'marker'],
            ...(GOOGLE_MAPS_ID ? { id: GOOGLE_MAPS_ID } : {}),
          })
          loaderConfigured = true
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Map } = (await importLibrary('maps')) as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Marker } = (await importLibrary('marker')) as any

        if (cancelled || !containerRef.current || !position) return

        const map = new Map(containerRef.current, {
          center: { lat: position.lat, lng: position.lng },
          zoom: 16,
          disableDefaultUI: true,
          ...(GOOGLE_MAPS_ID ? { mapId: GOOGLE_MAPS_ID } : {}),
        })

        const marker = new Marker({
          map,
          position: { lat: position.lat, lng: position.lng },
        })

        mapRef.current = map
        markerRef.current = marker
        setStatus('ready')
      } catch {
        // Silent fallback — the page keeps working without the map.
        if (!cancelled) setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [position])

  // Moves the marker and re-centers the map on every subsequent GPS fix.
  useEffect(() => {
    if (!position || !mapRef.current || !markerRef.current) return
    const latLng = { lat: position.lat, lng: position.lng }
    markerRef.current.setPosition(latLng)
    mapRef.current.panTo(latLng)
  }, [position])

  if (!GOOGLE_MAPS_API_KEY || status === 'error') {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-aliado-border bg-aliado-card text-sm text-aliado-sub">
        Mapa indisponível no momento
      </div>
    )
  }

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-aliado-border">
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-aliado-card">
          {position ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-aliado-muted border-t-aliado-orange" />
          ) : (
            <p className="text-sm text-aliado-sub">Aguardando sinal do GPS...</p>
          )}
        </div>
      )}
    </div>
  )
}
