'use client'

import { createContext, useContext, useEffect } from 'react'
import { useDomainRuntime } from './DomainRuntimeContext'
import type { DomainActivationState } from '../../domains/runtime/activation'

interface RealtimeDispatchContextValue {
  activation: DomainActivationState
}

const RealtimeDispatchContext = createContext<RealtimeDispatchContextValue | null>(null)

export function RealtimeDispatchProvider({ children }: { children: React.ReactNode }) {
  const runtime = useDomainRuntime()
  const activation = runtime.domains.realtime

  useEffect(() => {
    if (!activation.enabled || process.env.NODE_ENV === 'production') return
    console.debug({
      domain: 'realtime',
      lifecycle: 'activation',
      route: runtime.route,
      enabled: activation.enabled,
    })
  }, [activation.enabled, runtime.route])

  return (
    <RealtimeDispatchContext.Provider value={{ activation }}>
      {children}
    </RealtimeDispatchContext.Provider>
  )
}

export function useRealtimeDispatchDomain() {
  const value = useContext(RealtimeDispatchContext)
  if (!value) {
    throw new Error('useRealtimeDispatchDomain must be used inside <RealtimeDispatchProvider>')
  }
  return value
}
