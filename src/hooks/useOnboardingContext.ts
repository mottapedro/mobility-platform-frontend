'use client'

// ─── ALIADO Nacional V2 — Onboarding hook ──────────────────────────────────
// Anonymous-friendly hook used by /r/[slug] and /register to resolve the
// backend-governed OnboardingContext. No client-side flowType inference.
// ───────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { fetchOnboardingContext } from '../services/onboarding'
import { ApiError } from '../services/api'
import type { OnboardingContext } from '../types/network-v2'

interface UseOnboardingContextParams {
  slug?: string | null
  token?: string | null
}

interface UseOnboardingContextResult {
  context: OnboardingContext | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOnboardingContext(
  params: UseOnboardingContextParams,
): UseOnboardingContextResult {
  const { slug, token } = params
  const [context, setContext] = useState<OnboardingContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug && !token) return
    setLoading(true)
    setError(null)
    try {
      const next = await fetchOnboardingContext({
        slug: slug ?? undefined,
        token: token ?? undefined,
      })
      setContext(next)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Convite não encontrado ou expirado.')
      } else {
        setError('Não foi possível resolver o convite agora.')
      }
    } finally {
      setLoading(false)
    }
  }, [slug, token])

  useEffect(() => {
    load()
  }, [load])

  return { context, loading, error, refresh: load }
}
