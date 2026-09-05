'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyOfferHistory } from '../services/drivers'
import type { OfferBookItem } from '../types'

interface UseOfferHistoryResult {
  items: OfferBookItem[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  nextCursor: string | null
  hasMore: boolean
  loadMore: () => Promise<boolean>
  refresh: () => Promise<boolean>
}
function appendUnique(current: OfferBookItem[], incoming: OfferBookItem[]): OfferBookItem[] {
  const seen = new Set(current.map((item) => item.offerId))
  return [...current, ...incoming.filter((item) => !seen.has(item.offerId))]
}

export function useOfferHistory(enabled = true, limit = 20): UseOfferHistoryResult {
  const [items, setItems] = useState<OfferBookItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchPage = useCallback(async (cursor: string | undefined, append: boolean): Promise<boolean> => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const page = await getMyOfferHistory({ cursor, limit })
      setItems((current) => (append ? appendUnique(current, page.items) : page.items))
      setNextCursor(page.nextCursor)
      setError(null)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar histÃ³rico de ofertas.')
      return false
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (!enabled) return
    void fetchPage(undefined, false)
  }, [enabled, fetchPage])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return false
    return fetchPage(nextCursor, true)
  }, [fetchPage, loading, loadingMore, nextCursor])

  const refresh = useCallback(() => fetchPage(undefined, false), [fetchPage])

  return {
    items,
    loading,
    loadingMore,
    error,
    nextCursor,
    hasMore: nextCursor !== null,
    loadMore,
    refresh,
  }
}
