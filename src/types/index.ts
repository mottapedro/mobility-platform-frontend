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
  ride?: {
    id: string
    origin: string
    destination: string
    passengerId: string
    scheduledAt: string
    passenger?: { user: { name: string; phone?: string } }
  }
}

export type RideStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'WAITING_DRIVER'
  | 'WAITING_REFERRAL'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'

// ─── V1.3 — Contexto da corrida ────────────────────────────────────────────
export interface RideContext {
  isAirport?: boolean
  isPet?: boolean
  isLuggage?: boolean
  isVip?: boolean
}

// ─── V1.4 — Contexto regional (matching) ───────────────────────────────────
export interface RegionalContext {
  region?: string
  cluster?: string
  isRegionalPriority?: boolean
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

// ─── Driver Offer (retornado por GET /drivers/:id/offers) ──────────────────
export interface DriverOffer {
  id: string
  status: OfferStatus
  expiresAt: string
  createdAt: string
  rideRequest: {
    id: string
    origin: string
    destination: string
    scheduledAt: string
    status: string
    distanceKm?: number | null
    durationMin?: number | null
    context?: RideContext | null
    regionalContext?: RegionalContext | null
    passenger: {
      referredByDriverId?: string | null
      user: { name: string; phone?: string }
    }
  }
}
// ─── Driver Ride (retornado por GET /drivers/:id/rides) ───────────────────────
export interface DriverRide {
  id: string
  origin: string
  destination: string
  scheduledAt: string
  status: string
  context?: RideContext | null
  passenger: {
    user: { name: string; phone?: string }
  }
}
// ─── Driver Network (retornado por GET /drivers/:id/network) ────────────────
export interface DriverNetworkPassenger {
  id: string
  name: string
  ridesCount: number
  lastRideAt: string | null
}

export interface DriverNetwork {
  totalPassengers: number
  ridesCompleted: number
  estimatedRevenue: number
  recentPassengers: DriverNetworkPassenger[]
}

// ─── V1.5 — Driver Network Hierarchy (GET /drivers/:id/network/hierarchy) ──
export interface DriverNetworkNode {
  id: string
  name: string
  region?: string
  depth: number
  referrals: DriverNetworkNode[]
  // Future: ridesCount?: number; revenue?: number; acceptanceRate?: number; liquidityScore?: number
}

export interface DriverNetworkHierarchy {
  me: DriverNetworkNode
  referredBy: DriverNetworkNode | null
  referrals: DriverNetworkNode[]
  totalDrivers: number
  maxDepth: number
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'driver' | 'passenger'
  passengerId?: string
  driverId?: string
  referredByDriverId?: string | null
}
