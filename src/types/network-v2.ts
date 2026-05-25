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
}

export interface GenealogyNode {
  actor: NetworkActor
  depth: number
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
  invite: OnboardingInvite
  /** Root driver context — when present the registrant joins this driver's
   *  operational network. */
  rootDriver: RootDriverContext | null
}
