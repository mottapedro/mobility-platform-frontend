'use client'

// ─── ALIADO Nacional V2 — Genealogy projection hook ───────────────────────
// Fetches the flat BFS projection for a root driver from
// GET /drivers/:id/network/genealogy. Frontend consumes as-is — do NOT
// re-derive business logic from the projection data.
// ───────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { fetchGenealogyProjection } from '../services/network'
import { ApiError } from '../services/api'
import type { GenealogyProjection } from '../types/network-v2'

interface UseGenealogyProjectionParams {
  driverId: string | null
  maxDepth?: number
}

interface UseGenealogyProjectionResult {
  projection: GenealogyProjection | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useGenealogyProjection(
  params: UseGenealogyProjectionParams,
): UseGenealogyProjectionResult {
  const { driverId, maxDepth } = params
  const [projection, setProjection] = useState<GenealogyProjection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!driverId) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchGenealogyProjection(driverId, { maxDepth })
      setProjection(result)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Árvore genealógica não encontrada.')
      } else {
        setError('Não foi possível carregar a árvore da rede.')
      }
    } finally {
      setLoading(false)
    }
  }, [driverId, maxDepth])

  useEffect(() => {
    load()
  }, [load])

  return { projection, loading, error, refresh: load }
}
