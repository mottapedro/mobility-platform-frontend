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
  | 'REQUESTED'
  | 'OWNER_DISPATCH'
  | 'NETWORK_DISPATCH'
  | 'OWNER_RECOVERY'
  | 'PENDING'
  | 'MATCHING'
  | 'WAITING_DRIVER'
  | 'WAITING_REFERRAL'
  | 'WAITING_PARTNER'
  | 'WAITING_GENERAL'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'

// â”€â”€â”€ V1.3 â€” Contexto da corrida â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface RideContext {
  isAirport?: boolean
  isPet?: boolean
  isAssistedTransport?: boolean
  isLuggage?: boolean
  isVip?: boolean
}

// â”€â”€â”€ V1.4 â€” Contexto regional (matching) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  rootDriverId: string // Added for guideline 7
  operationalOwnerId: string // Added for guideline 7
  flowType: 'D2D' | 'D2P' | 'P2P' // Added for guideline 7 and 6
  createdAt: string
  updatedAt: string // Added for guideline 16
  createdBy: string // Added for guideline 16
  updatedBy: string // Added for guideline 16
  context?: RideContext | null
  distanceKm?: number | null
  durationMin?: number | null
  priceBrl?: number | null
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
  notes?: string
  originLat?: number
  originLng?: number
  destLat?: number
  destLng?: number
}

// â”€â”€â”€ Driver Offer (retornado por GET /drivers/:id/offers) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    priceBrl?: number | null
    context?: RideContext | null
    regionalContext?: RegionalContext | null
    passenger: {
      referredByDriverId?: string | null
      user: { name: string; phone?: string }
    }
  }
}
// â”€â”€â”€ Driver Ride (retornado por GET /drivers/:id/rides) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface DriverRide {
  id: string
  origin: string
  destination: string
  scheduledAt: string
  status: string
  distanceKm?: number | null
  durationMin?: number | null
  priceBrl?: number | null
  context?: RideContext | null
  passenger: {
    user: { name: string; phone?: string }
  }
}
// â”€â”€â”€ Driver Network (retornado por GET /drivers/:id/network) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ V1.5 â€” Driver Network Hierarchy (GET /drivers/:id/network/hierarchy) â”€â”€
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

export interface PassengerNetworkReferral {
  id: string
  name: string
  createdAt: string
  status?: 'active' | 'new' | string
  ridesCount?: number
}

export interface PassengerNetwork {
  totalReferrals: number
  activeReferrals?: number
  growth?: number
  growthPercent?: number
  ridesFromNetwork?: number
  level1: string[]
  level2: string[]
  level3: string[]
  recentReferrals: PassengerNetworkReferral[]
}

export interface PassengerNetworkNode {
  id: string
  name: string
  referralCode?: string | null
  networkLevel?: number
  referrals?: PassengerNetworkNode[]
}

export interface PassengerNetworkHierarchy {
  me: PassengerNetworkNode
  referredBy: PassengerNetworkNode | null
  referrals: PassengerNetworkNode[]
  totalPassengers: number
  maxDepth: number
}

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'driver' | 'passenger'
  passengerId?: string
  driverId?: string
  publicSlug?: string
  referralCode?: string
  referredByDriverId?: string | null
}

