'use client'

import { createContext, useContext } from 'react'
import { useDomainRuntime } from './DomainRuntimeContext'
import type { DomainActivationState } from '../../domains/runtime/activation'

interface RelationshipDomainContextValue {
  activation: DomainActivationState
}

const FALLBACK_ACTIVATION: DomainActivationState = {
  enabled: true,
  isReady: true,
  isHydrated: true,
  hasIdentity: true,
}

const RelationshipDomainContext = createContext<RelationshipDomainContextValue | null>(null)

export function RelationshipDomainProvider({ children }: { children: React.ReactNode }) {
  const runtime = useDomainRuntime()
  const activation = runtime.domains.relationship

  return (
    <RelationshipDomainContext.Provider value={{ activation }}>
      {children}
    </RelationshipDomainContext.Provider>
  )
}

export function useRelationshipDomain() {
  const value = useContext(RelationshipDomainContext)
  if (!value) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('useRelationshipDomain without provider: using fallback activation')
    }
    return { activation: FALLBACK_ACTIVATION }
  }
  return value
}
