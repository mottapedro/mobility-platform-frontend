'use client'

// ─── ALIADO Nacional V2 — Root driver selector ─────────────────────────────
// Pure derived hook. Given either a NetworkContext or an OnboardingContext
// (or null), returns the normalized RootDriverContext exposed by the backend.
// No fetching, no inference — this is a typed selector for components.
// ───────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import type {
  NetworkContext,
  OnboardingContext,
  RootDriverContext,
} from '../types/network-v2'

type SourceContext = NetworkContext | OnboardingContext | null | undefined

function isNetworkContext(ctx: NonNullable<SourceContext>): ctx is NetworkContext {
  return 'genealogy' in ctx
}

function vehicleSummary(actor: NonNullable<NetworkContext['rootDriver']>): string | null {
  const v = actor.vehicle
  if (!v) return null
  const parts = [v.brand, v.model].filter(Boolean).join(' ')
  return v.plate ? `${parts} • ${v.plate}` : parts || null
}

/**
 * Selector for the canonical root driver of an operational network.
 * Returns `null` when the source context is absent or has no rootDriver.
 */
export function useRootDriverContext(source: SourceContext): RootDriverContext | null {
  return useMemo(() => {
    if (!source) return null

    if (isNetworkContext(source)) {
      const rd = source.rootDriver
      if (!rd) return null
      return {
        id: rd.id,
        name: rd.name,
        slug: rd.slug ?? null,
        region: rd.region ?? null,
        vehicleSummary: vehicleSummary(rd),
        rating: rd.rating ?? null,
        offersAssistedTransport: rd.offersAssistedTransport,
      }
    }

    // OnboardingContext already exposes RootDriverContext directly.
    return source.rootDriver ?? null
  }, [source])
}
