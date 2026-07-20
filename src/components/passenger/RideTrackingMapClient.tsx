'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { RideLocation } from '../../types'

type Props = {
  location: RideLocation | null
  isStale: boolean
}

function buildCarIcon(direcaoGraus: number, isStale: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      transform: rotate(${direcaoGraus}deg);
      transition: transform 0.4s ease, opacity 0.4s ease;
      opacity: ${isStale ? 0.4 : 1};
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
    ">🚗</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function RideTrackingMapClient({ location, isStale }: Props) {
  const icon = useMemo(
    () => (location ? buildCarIcon(location.direcaoGraus, isStale) : null),
    [location, isStale],
  )

  const center: [number, number] = location ? [location.lat, location.lng] : [-22.9068, -43.1729]

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '288px', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {location && icon && <Marker position={[location.lat, location.lng]} icon={icon} />}
      </MapContainer>

      {isStale && (
        <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-full border border-[#F28C28]/30 bg-[#1A0E04]/90 px-4 py-2 text-center text-xs font-semibold text-[#F28C28] backdrop-blur">
          Aguardando sinal do GPS do motorista...
        </div>
      )}
    </div>
  )
}
