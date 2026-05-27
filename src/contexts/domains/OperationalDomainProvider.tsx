'use client'

import { createContext, useContext } from 'react'
import { useDomainRuntime } from './DomainRuntimeContext'
import { RealtimeDispatchProvider } from './RealtimeDispatchProvider'
import type { DomainActivationState } from '../../domains/runtime/activation'

interface OperationalDomainContextValue {
  activation: DomainActivationState
}

const FALLBACK_ACTIVATION: DomainActivationState = {
  enabled: true,
  isReady: true,
  isHydrated: true,
  hasIdentity: true,
}

const OperationalDomainContext = createContext<OperationalDomainContextValue | null>(null)

export function OperationalDomainProvider({ children }: { children: React.ReactNode }) {
  const runtime = useDomainRuntime()
  const activation = runtime.domains.operational

  return (
    <OperationalDomainContext.Provider value={{ activation }}>
      <RealtimeDispatchProvider>{children}</RealtimeDispatchProvider>
    </OperationalDomainContext.Provider>
  )
}

export function useOperationalDomain() {
  const value = useContext(OperationalDomainContext)
  if (!value) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('useOperationalDomain without provider: using fallback activation')
    }
    return { activation: FALLBACK_ACTIVATION }
  }
  return value
}
