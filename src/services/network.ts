// ─── ALIADO Nacional V2 — Network service ──────────────────────────────────
// Single source of truth on the frontend for a relational network view.
// The backend produces a fully-resolved NetworkContext; the frontend MUST
// NOT infer flowType, ownership, ancestry or display labels.
//
// During the V2 rollout, when NEXT_PUBLIC_USE_MOCK_NETWORK=1 we serve
// deterministic fixtures so UI work can land without waiting on backend.
// ───────────────────────────────────────────────────────────────────────────
import { apiRequest } from './api'
import type { ActorType, NetworkContext } from '../types/network-v2'
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

/**
 * Fetch the relational network context for the given actor.
 *
 * Backend contract: GET /network/context?actorType={actorType}
 * Auth: session cookie + `x-driver-id` header (handled by apiRequest when
 * the actor is the authenticated user).
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
  return apiRequest<NetworkContext>(endpoint)
}
