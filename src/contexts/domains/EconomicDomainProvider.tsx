'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useDomainRuntime } from './DomainRuntimeContext'
import { getDriverNetwork } from '../../services/drivers'
import { readStoredDriverId, resolveDriverId } from '../../utils/driverId'
import type { DomainActivationState } from '../../domains/runtime/activation'

export interface EconomicSnapshot {
  passengers: number
  rides: number
  revenue: number
}

interface EconomicDomainContextValue {
  activation: DomainActivationState
  loading: boolean
  error: string | null
  snapshot: EconomicSnapshot | null
  refresh: () => Promise<void>
}

const EconomicDomainContext = createContext<EconomicDomainContextValue | null>(null)

export function EconomicDomainProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const runtime = useDomainRuntime()
  const activation = runtime.domains.economic
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<EconomicSnapshot | null>(null)

  const driverId = useMemo(
    () => resolveDriverId(user?.driverId, readStoredDriverId()),
    [user?.driverId],
  )

  const load = useCallback(async () => {
    if (!activation.enabled || !driverId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const network = await getDriverNetwork(driverId)
      setSnapshot({
        passengers: (network.totalPassengers ?? 0),
        rides: network.ridesCompleted ?? 0,
        revenue: network.estimatedRevenue ?? 0,
      })
    } catch {
      setError('Não foi possível carregar os dados econômicos agora.')
    } finally {
      setLoading(false)
    }
  }, [activation.enabled, driverId])

  useEffect(() => {
    if (!activation.enabled) {
      setSnapshot(null)
      setLoading(false)
      setError(null)
      return
    }

    void load()
  }, [activation.enabled, load])

  useEffect(() => {
    if (!activation.enabled || process.env.NODE_ENV === 'production') return
    console.debug({
      domain: 'economic',
      lifecycle: 'activation',
      route: runtime.route,
      enabled: activation.enabled,
      hasSnapshot: Boolean(snapshot),
    })
  }, [activation.enabled, runtime.route, snapshot])

  return (
    <EconomicDomainContext.Provider
      value={{
        activation,
        loading,
        error,
        snapshot,
        refresh: load,
      }}
    >
      {children}
    </EconomicDomainContext.Provider>
  )
}

export function useEconomicDomain() {
  const value = useContext(EconomicDomainContext)
  if (!value) {
    throw new Error('useEconomicDomain must be used inside <EconomicDomainProvider>')
  }
  return value
}
