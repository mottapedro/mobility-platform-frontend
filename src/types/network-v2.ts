// ─── ALIADO Nacional V2 ────────────────────────────────────────────────────
// Backend-governed relational network types.
// Frontend MUST NOT infer flowType, ownership, genealogy or referral
// semantics. These types describe data the backend produces.
// ───────────────────────────────────────────────────────────────────────────

export type FlowType =
  | 'DRIVER_TO_DRIVER'
  | 'DRIVER_TO_PASSENGER'
  | 'PASSENGER_TO_PASSENGER'

export type ActorType = 'driver' | 'passenger'

// ─── Building blocks ───────────────────────────────────────────────────────

export interface NetworkActor {
  id: string
  actorType: ActorType
  name: string
  slug?: string | null
  region?: string | null
  avatarUrl?: string | null
  joinedAt?: string | null
}

export interface NetworkDriverActor extends NetworkActor {
  actorType: 'driver'
  vehicle?: {
    brand?: string
    model?: string
    plate?: string
    category?: string
  } | null
  rating?: number | null
  offersAssistedTransport?: boolean
}

export interface NetworkPassengerActor extends NetworkActor {
  actorType: 'passenger'
  ridesCount?: number
}

// ─── Genealogy (backend-resolved) ──────────────────────────────────────────

// ─── Genealogy projection (GET /drivers/:id/network/genealogy) ─────────────
// Flat graph read model returned by BuildGenealogyProjectionService.
// Frontend consumes as-is — do NOT re-derive business logic from this.

export interface GenealogyProjectionNode {
  actorId: string
  actorType: 'DRIVER' | 'PASSENGER'
  name: string
  flowType: string
  level: number
  /** Governance/global depth retained for analytics and ownership rules. */
  absoluteDepth?: number
  rootDriverId: string
  parentId: string | null
  publicSlug: string | null
  referralCode: string | null
  networkLevel: number
  isActive?: boolean
  createdAt: string
  territory?: {
    region?: string | null
    city?: string | null
    operationalZone?: string | null
  } | null
}

export interface GenealogyProjectionEdge {
  sourceActorId: string
  targetActorId: string
  flowType: string
}

export interface GenealogyProjectionLevel {
  /** BFS depth of this level (0 = root). */
  depth: number
  /** Ordered list of actorIds at this depth. */
  nodeIds: string[]
}

export interface GenealogyProjectionStats {
  totalNodes: number
  totalEdges: number
  maxDepth: number
  appliedDepthLimit: number
}

export interface GenealogyProjectionMetrics {
  totalDrivers: number
  totalPassengers: number
  totalRelationships: number
  totalD2D: number
  totalD2P: number
  totalP2P: number
  maxDepth: number
}

export interface GenealogyProjectionRootDriver {
  id: string
  name: string
  experienceLevel: string | null
  networkLevel: number
  publicSlug: string | null
  referralCode: string | null
}

/** Full genealogy tree projection returned by GET /drivers/:id/network/genealogy */
export interface GenealogyProjection {
  rootDriver: GenealogyProjectionRootDriver
  stats: GenealogyProjectionStats
  nodes: GenealogyProjectionNode[]
  edges: GenealogyProjectionEdge[]
  levels: GenealogyProjectionLevel[]
  metrics: GenealogyProjectionMetrics
}

// ─── Executive Network View Model (frontend-only) ─────────────────────────
// Built by buildExecutiveTree() from GenealogyProjection.
// NEVER sent by the backend — this is a derived presentation layer type.

export type InfluenceTier =
  | 'ROOT'
  | 'ELITE'
  | 'HUB'
  | 'EXPANSION'
  | 'OPERATIONAL'
  | 'BEGINNER'
  | 'CLIENT'

export type NodeTier = 'root' | 'leader' | 'operator' | 'client'

/**
 * Frontend view-model built by buildExecutiveTree().
 * Carries derived tier, influence classification, recursive children,
 * and stub metric slots that populate automatically when the backend ships
 * per-node metrics (Phase 3).
 */
export interface ExecutiveGenealogyNode {
  actorId: string
  actorType: 'DRIVER' | 'PASSENGER'
  name: string
  level: number
  /** Passthrough for governance; never used for relative UI labels. */
  absoluteDepth?: number
  flowType: string
  parentId: string | null
  tier: NodeTier
  isHub: boolean
  influenceTier: InfluenceTier
  children: ExecutiveGenealogyNode[]
  metrics: {
    activePassengers: number
    activeDrivers: number
    completedRides: number
    estimatedRevenueCents: number
    networkDepth: number
  }
  ownership?: {
    rootDriverId?: string
    influenceScore?: number
  }
  territory?: {
    region?: string | null
    city?: string | null
    operationalZone?: string | null
  } | null
}

// ─── Genealogy (backend-resolved) ──────────────────────────────────────────

export interface Genealogy {
  /** The current actor. */
  me: NetworkActor
  /** Social path going up (immediate inviter → ... → root). Empty if me is root. */
  ancestors: NetworkActor[]
  /** Recursive social tree below me. Backend guarantees no cycles. */
  descendants: GenealogyNode[]
  /** Lateral expansion — siblings under the same parent. */
  lateral: NetworkActor[]
  /** Operational owner — the driver who operationally owns this passenger
   *  (null for drivers, or for orphan passengers awaiting allocation). */
  operationalOwner: NetworkDriverActor | null
  /** Full flat-graph projection from BuildGenealogyProjectionService.
   *  Populated by fetchGenealogyProjection(). Absent when not yet loaded. */
  tree?: GenealogyProjection | null
}

export interface GenealogyNode {
  actor: NetworkActor
  depth: number
  /** Absolute/global depth retained for governance and analytics. */
  absoluteDepth?: number
  children: GenealogyNode[]
}

// ─── Metrics ───────────────────────────────────────────────────────────────

export interface NetworkMetrics {
  totalActors: number
  activeCount: number
  depth: number
  ridesFromNetwork?: number
  estimatedRevenue?: number
  growth?: {
    last7Days?: number
    last30Days?: number
  }
}

// ─── Capability context (backend-governed) ─────────────────────────────────
// Frontend MUST NOT infer capabilities. Render exactly what the backend sends.
// When absent (backend not yet implemented), components fall back to
// URL-presence heuristic for graceful degradation only.

export interface NetworkCapabilityContext {
  /** Driver may generate and share passenger invite links. */
  canInvitePassengers: boolean
  /** Driver may generate and share driver invite links. */
  canInviteDrivers: boolean
  /** Driver is eligible to receive network rewards. */
  canReceiveRewards: boolean
  /** Driver may deepen the network (recruit sub-drivers). */
  canExpandNetwork: boolean
  /** Domain skill codes active for this driver (e.g. 'COLECIONADOR'). */
  skillCodes: string[]
}

// ─── Top-level network context (GET /network/context) ──────────────────────

export interface NetworkContext {
  flowType: FlowType
  /** Which actor type the backend expects the caller to be in this view. */
  targetActorExpected: ActorType
  /** Root driver of the operational network this actor belongs to.
   *  Always present for passengers; for drivers it points to their referrer
   *  (or themselves if they are root). */
  rootDriver: NetworkDriverActor | null
  genealogy: Genealogy
  networkMetrics: NetworkMetrics
  /** Backend-governed invite URLs for each expansion channel.
   *  Frontend MUST NOT construct these — consume exactly as returned.
   *  Absent until the backend publishes GET /drivers/me/invites. */
  inviteUrls?: {
    driverToPassenger?: string | null
    driverToDriver?: string | null
  } | null
  /** Explicit capability flags for this actor.
   *  When present, components MUST use these instead of URL-presence inference.
   *  Absent until the backend implements capability propagation. */
  capabilities?: NetworkCapabilityContext | null
}

// ─── Onboarding context (GET /onboarding/context) ──────────────────────────
// Used by /r/[slug] landing page and /register to render the correct flow
// without any client-side inference.

export interface OnboardingInviter {
  id: string
  actorType: ActorType
  name: string
  avatarUrl?: string | null
  region?: string | null
}

export interface OnboardingInvite {
  /** Opaque referral code the backend will accept on register. */
  code: string
  /** Display label fully formatted by the backend (no client formatting). */
  displayLabel: string
  inviter: OnboardingInviter
}

export interface RootDriverContext {
  id: string
  name: string
  slug?: string | null
  region?: string | null
  vehicleSummary?: string | null
  rating?: number | null
  offersAssistedTransport?: boolean
}

export interface OnboardingContext {
  flowType: FlowType
  /** Which actor type the new registrant is expected to be. */
  expectedActor: ActorType
  /** Backend must always populate invite on a 200. Typed nullable here
   *  for defensive rendering — treat null as "not found". */
  invite: OnboardingInvite | null
  /** Root driver context — when present the registrant joins this driver's
   *  operational network. */
  rootDriver: RootDriverContext | null
}
