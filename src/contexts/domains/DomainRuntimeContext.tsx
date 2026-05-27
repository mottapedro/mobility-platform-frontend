'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../AuthContext'
import { readStoredDriverId, resolveDriverId, sanitizeDriverId } from '../../utils/driverId'
import {
  buildDomainRuntimeSnapshot,
  type DomainRuntimeSnapshot,
} from '../../domains/runtime/activation'

interface DomainRuntimeContextValue {
  snapshot: DomainRuntimeSnapshot
}

const DomainRuntimeContext = createContext<DomainRuntimeContextValue | null>(null)

function readStoredPassengerId(): string | null {
  if (typeof window === 'undefined') return null
  return sanitizeDriverId(localStorage.getItem('passengerId'))
}

export function DomainRuntimeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [hydrationReady, setHydrationReady] = useState(false)

  useEffect(() => {
    setHydrationReady(true)
  }, [])

  const driverId = useMemo(
    () => resolveDriverId(user?.driverId, readStoredDriverId()),
    [user?.driverId],
  )

  const passengerId = useMemo(
    () => resolveDriverId(user?.passengerId, readStoredPassengerId()),
    [user?.passengerId],
  )

  const snapshot = useMemo(
    () =>
      buildDomainRuntimeSnapshot({
        pathname,
        authReady: !loading && Boolean(user),
        hydrationReady,
        role: user?.role ?? null,
        driverId,
        passengerId,
      }),
    [driverId, hydrationReady, loading, passengerId, pathname, user],
  )

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    console.debug({
      domain: 'runtime',
      lifecycle: 'activation',
      route: snapshot.route,
      enabled: snapshot.domains,
    })
  }, [snapshot])

  return (
    <DomainRuntimeContext.Provider value={{ snapshot }}>
      {children}
    </DomainRuntimeContext.Provider>
  )
}

export function useDomainRuntime() {
  const value = useContext(DomainRuntimeContext)
  if (!value) {
    throw new Error('useDomainRuntime must be used inside <DomainRuntimeProvider>')
  }
  return value.snapshot
}
