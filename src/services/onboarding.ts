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
}

/**
 * Fetch the onboarding context.
 *
 * Backend contract: GET /onboarding/context?slug=... OR ?token=...
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
  const qs = new URLSearchParams()
  if (params.slug) qs.set('slug', params.slug)
  if (params.token) qs.set('token', params.token)
  return apiRequest<OnboardingContext>(`/onboarding/context?${qs.toString()}`)
}
