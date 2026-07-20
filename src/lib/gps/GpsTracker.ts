import { sendGpsPing } from '../../services/rides'

// Throttles watchPosition callbacks (which can fire multiple times per
// second) down to the same 4s cadence used by the passenger-side polling
// (useRideLocationPolling), so the backend sees one ping per cycle instead
// of a flood of updates on every GPS jitter.
const MIN_PING_INTERVAL_MS = 4000

export interface GpsTrackerHandle {
  stop: () => void
}

export interface GpsTrackerPosition {
  lat: number
  lng: number
  heading: number | null
}

export interface GpsTrackerOptions {
  onError?: (message: string) => void
  // Fires on every raw watchPosition update (unthrottled) so the UI (map
  // marker) can track smoothly — independent of the throttled network ping.
  onPosition?: (position: GpsTrackerPosition) => void
}

export function startGpsTracker(
  rideId: string,
  driverId: string,
  options: GpsTrackerOptions = {},
): GpsTrackerHandle {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    options.onError?.('Geolocalização não suportada neste dispositivo.')
    return { stop: () => {} }
  }

  let lastPingAt = 0
  let sending = false

  function handlePosition(position: GeolocationPosition) {
    const { latitude, longitude, heading } = position.coords
    options.onPosition?.({ lat: latitude, lng: longitude, heading })

    const now = Date.now()
    if (now - lastPingAt < MIN_PING_INTERVAL_MS || sending) return
    lastPingAt = now
    sending = true

    sendGpsPing(rideId, {
      driverId,
      lat: latitude,
      lng: longitude,
      direcaoGraus: heading ?? 0,
    })
      .catch(() => {
        options.onError?.('Falha ao enviar localização. Verifique sua conexão.')
      })
      .finally(() => {
        sending = false
      })
  }

  function handleError(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      options.onError?.('Permissão de localização negada. Ative o GPS para continuar a viagem.')
      return
    }
    if (error.code === error.TIMEOUT) {
      options.onError?.(
        'Sem sinal de GPS. Verifique se a localização está ativada no sistema (Windows: Configurações > Privacidade > Localização) e tente novamente.',
      )
      return
    }
    options.onError?.('Não foi possível obter sua localização.')
  }

  const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    // Without a timeout, watchPosition can hang indefinitely with no
    // success and no error callback (observed on desktop Chrome when the
    // OS location service is off) — surface a clear error instead.
    timeout: 10000,
  })

  return {
    stop: () => navigator.geolocation.clearWatch(watchId),
  }
}
