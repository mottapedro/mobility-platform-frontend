export interface Vehicle {
  id: string
  model: string
  brand: string
  plate: string
  color?: string
}

export interface Driver {
  id: string
  user: {
    name: string
    phone?: string
  }
  vehicles: Vehicle[]
}

export interface Passenger {
  id: string
  referredByDriverId: string | null
  user: {
    name: string
    phone?: string
  }
  referredByDriver: Driver | null
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface Offer {
  id: string
  status: OfferStatus
  expiresAt: string
  driver: Driver
}

export type RideStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'WAITING_DRIVER'
  | 'ACCEPTED'
  | 'EXPIRED'

// ─── V1.3 — Contexto da corrida ────────────────────────────────────────────
export interface RideContext {
  isAirport?: boolean
  isPet?: boolean
  isLuggage?: boolean
  isVip?: boolean
}

export interface Ride {
  id: string
  passengerId: string
  origin: string
  destination: string
  scheduledAt: string
  status: RideStatus
  selectedDriverId: string | null
  createdAt: string
  context?: RideContext | null
  passenger: {
    user: {
      name: string
    }
  }
  offers: Offer[]
}

export interface CreateRidePayload {
  passengerId: string
  origin: string
  destination: string
  scheduledAt: string
  context?: RideContext
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'driver' | 'passenger'
}
