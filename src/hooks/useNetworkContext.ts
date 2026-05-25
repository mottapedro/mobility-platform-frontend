'use client'

// ─── ALIADO Nacional V2 — Network hook ─────────────────────────────────────
// Authenticated hook that subscribes to the backend-governed NetworkContext.
// Frontend MUST NOT derive flowType, genealogy or ownership — this hook is
// a pure wire to `fetchNetworkContext`.
// ───────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { fetchNetworkContext } from '../services/network'
import { ApiError } from '../services/api'
import type { ActorType, NetworkContext } from '../types/network-v2'

interface UseNetworkContextParams {
  actorId: string | null
  actorType: ActorType | null
}

interface UseNetworkContextResult {
  context: NetworkContext | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useNetworkContext(
  params: UseNetworkContextParams,
): UseNetworkContextResult {
  const { actorId, actorType } = params
  const [context, setContext] = useState<NetworkContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!actorId || !actorType) return
    setLoading(true)
    setError(null)
    try {
      const next = await fetchNetworkContext({ actorId, actorType })
      setContext(next)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Rede não encontrada para este perfil.')
      } else {
        setError('Não foi possível carregar sua rede agora.')
      }
    } finally {
      setLoading(false)
    }
  }, [actorId, actorType])

  useEffect(() => {
    load()
  }, [load])

  // Re-fetch on window focus so the actor sees newly-joined network members.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onFocus = () => { load() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  return { context, loading, error, refresh: load }
}
