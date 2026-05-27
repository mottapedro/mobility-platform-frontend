// ─── ALIADO Nacional V2 — Network service ──────────────────────────────────
// Single source of truth on the frontend for a relational network view.
// The backend produces a fully-resolved NetworkContext; the frontend MUST
// NOT infer flowType, ownership, ancestry or display labels.
//
// During the V2 rollout, when NEXT_PUBLIC_USE_MOCK_NETWORK=1 we serve
// deterministic fixtures so UI work can land without waiting on backend.
// ───────────────────────────────────────────────────────────────────────────
import { apiRequest } from './api'
import type {
  ActorType,
  FlowType,
  Genealogy,
  GenealogyProjection,
  NetworkContext,
  NetworkMetrics,
  NetworkCapabilityContext,
} from '../types/network-v2'
import {
  pickNetworkFixtureForActor,
} from './__mocks__/network.fixtures'

const MOCK_ENV_FLAG = 'NEXT_PUBLIC_USE_MOCK_NETWORK'

function shouldUseMock(): boolean {
  return process.env[MOCK_ENV_FLAG] === '1'
}

export interface FetchNetworkContextParams {
  actorId: string
  actorType: ActorType
}

// ─── Anti-corruption adapter ────────────────────────────────────────────────
// The backend's GET /network/context (v2 implementation) returns a flat
// ownership/relationships shape that doesn't match the frontend NetworkContext
// contract. This adapter normalises the response so all downstream components
// and hooks stay untouched.
//
// Detection: backend v2 shape has a top-level `state` field.
//            Legacy shape (mock fixtures) has a top-level `flowType` field.
// ───────────────────────────────────────────────────────────────────────────

interface BackendNetworkContextV2 {
  state: 'ACTIVE' | 'UNINITIALIZED'
  actorId: string
  actorType: 'DRIVER' | 'PASSENGER'
  rootDriverId: string
  isRoot: boolean
  networkLevel: string | null
  publicSlug: string | null
  referralCode: string | null
  relationships?: {
    totals?: {
      total?: number
      driverToDriver?: number
      driverToPassenger?: number
      passengerToPassenger?: number
    }
  } | null
  ownership?: {
    totalDriversInTree?: number
    totalPassengersInTree?: number
    completedRidesAttributedToTree?: number
    settledRevenueShareCents?: number
  } | null
  capabilities?: NetworkCapabilityContext | null
  inviteUrls?: {
    driverToPassenger?: string | null
    driverToDriver?: string | null
  } | null
}

function isBackendV2Shape(raw: unknown): raw is BackendNetworkContextV2 {
  return typeof raw === 'object' && raw !== null && 'state' in raw
}

function adaptBackendV2(raw: BackendNetworkContextV2): NetworkContext {
  const actorType: ActorType = raw.actorType === 'PASSENGER' ? 'passenger' : 'driver'

  // Derive flowType: drivers default to D2D; passengers use D2P.
  const flowType: FlowType =
    actorType === 'passenger' ? 'DRIVER_TO_PASSENGER' : 'DRIVER_TO_DRIVER'

  // Minimal genealogy — tree is not yet returned by the backend.
  // Downstream components guard against empty arrays gracefully.
  const genealogy: Genealogy = {
    me: { id: raw.actorId, actorType, name: raw.publicSlug ?? '' },
    ancestors: [],
    descendants: [],
    lateral: [],
    operationalOwner: null,
  }

  // Map backend ownership metrics → frontend NetworkMetrics.
  const own = raw.ownership ?? {}
  const networkMetrics: NetworkMetrics = {
    totalActors:
      (own.totalDriversInTree ?? 0) + (own.totalPassengersInTree ?? 0),
    activeCount: own.totalDriversInTree ?? 0,
    depth: 0,
    ridesFromNetwork: own.completedRidesAttributedToTree ?? 0,
    estimatedRevenue:
      own.settledRevenueShareCents != null
        ? own.settledRevenueShareCents / 100
        : undefined,
  }

  return {
    flowType,
    targetActorExpected: actorType,
    rootDriver: null, // rootDriverId available but full actor object not yet returned
    genealogy,
    networkMetrics,
    inviteUrls: raw.inviteUrls ?? null,
    capabilities: raw.capabilities ?? null,
  }
}

/**
 * Fetch the relational network context for the given actor.
 *
 * Backend contract: GET /network/context?actorId={id}&actorType={type}
 * Auth: session cookie + `x-driver-id` header (handled by apiRequest when
 * the actor is the authenticated user).
 *
 * The response is normalised through adaptBackendV2() when the backend
 * returns its v2 shape (`{ state, actorId, … }`), keeping all consuming
 * hooks and components insulated from the wire format.
 */
export async function fetchNetworkContext(
  params: FetchNetworkContextParams,
): Promise<NetworkContext> {
  if (shouldUseMock()) {
    return Promise.resolve(pickNetworkFixtureForActor(params.actorType))
  }
  const endpoint =
    `/network/context?actorId=${encodeURIComponent(params.actorId)}` +
    `&actorType=${encodeURIComponent(params.actorType)}`
  const raw = await apiRequest<unknown>(endpoint)
  if (isBackendV2Shape(raw)) {
    return adaptBackendV2(raw)
  }
  // Legacy / already-shaped response (backward compat).
  return raw as NetworkContext
}

/**
 * Fetch the flat genealogy tree projection for a root driver.
 *
 * Backend contract: GET /drivers/:id/network/genealogy?maxDepth={n}
 * Returns the full BFS-projected graph: nodes / edges / levels / metrics.
 *
 * Frontend MUST NOT re-derive business logic from the projection —
 * render it as-is for tree visualisation.
 */
export async function fetchGenealogyProjection(
  driverId: string,
  options: { maxDepth?: number } = {},
): Promise<GenealogyProjection> {
  const base = `/drivers/${encodeURIComponent(driverId)}/network/genealogy`
  const url =
    options.maxDepth !== undefined ? `${base}?maxDepth=${options.maxDepth}` : base
  return apiRequest<GenealogyProjection>(url)
}
