// ─── ALIADO Nacional V2 — Onboarding service ───────────────────────────────
// Resolves OnboardingContext for /r/[slug] and /register, governed by the
// backend so the frontend never infers flowType or invite labels.
// ───────────────────────────────────────────────────────────────────────────
import { apiRequest } from './api'
import type { OnboardingContext } from '../types/network-v2'
import { pickOnboardingFixtureForSlugOrToken } from './__mocks__/network.fixtures'

const MOCK_ENV_FLAG = 'NEXT_PUBLIC_USE_MOCK_NETWORK'

function shouldUseMock(): boolean {
  return process.env[MOCK_ENV_FLAG] === '1'
}

export interface FetchOnboardingContextParams {
  /** Public slug from the /r/[slug] landing page. */
  slug?: string
  /** Opaque invite token (deep link, future channels). */
  token?: string
  /** Transport the onboarding flow context (e.g., 'd2d', 'd2p') explicitly */
  flow?: string
}

/**
 * Fetch the onboarding context.
 *
 * Backend contract:
 *   - Public slug (resource identity): GET /onboarding/context/:slug
 *   - Opaque token (deep link):        GET /onboarding/context?token=...
 *
 * Auth: anonymous (this is the pre-registration step).
 *
 * At least one of `slug` or `token` must be provided.
 */
export async function fetchOnboardingContext(
  params: FetchOnboardingContextParams,
): Promise<OnboardingContext> {
  if (!params.slug && !params.token) {
    throw new Error('fetchOnboardingContext requires slug or token')
  }
  if (shouldUseMock()) {
    return Promise.resolve(pickOnboardingFixtureForSlugOrToken(params))
  }
  if (params.slug) {
    let url = `/onboarding/context/${encodeURIComponent(params.slug)}`
    if (params.flow) {
      const query = new URLSearchParams({ flow: params.flow })
      url += `?${query.toString()}`
    }
    return apiRequest<OnboardingContext>(url)
  }
  const query = new URLSearchParams({ token: params.token! })
  if (params.flow) query.set('flow', params.flow)
  return apiRequest<OnboardingContext>(`/onboarding/context?${query.toString()}`)
}
