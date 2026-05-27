export type DomainName = 'relationship' | 'operational' | 'economic' | 'realtime'

export type DomainRouteKind = 'relationship' | 'operational' | 'economic' | 'unknown'

export interface DomainActivationState {
  enabled: boolean
  isReady: boolean
  isHydrated: boolean
  hasIdentity: boolean
}

export interface DomainRuntimeSnapshot {
  route: string
  routeKind: DomainRouteKind
  authReady: boolean
  hydrationReady: boolean
  role: 'driver' | 'passenger' | null
  driverId: string | null
  passengerId: string | null
  domains: Record<DomainName, DomainActivationState>
}

const RELATIONSHIP_ROUTES = [/^\/driver\/network(?:\/|$)/, /^\/passenger\/network(?:\/|$)/]
const OPERATIONAL_ROUTES = [
  /^\/driver\/offers(?:\/|$)/,
  /^\/driver\/dispatch(?:\/|$)/,
  /^\/driver\/rides(?:\/|$)/,
]
const ECONOMIC_ROUTES = [/^\/driver\/(ganhos|revenue|rewards)(?:\/|$)/]

export function classifyDomainRoute(pathname: string): DomainRouteKind {
  if (RELATIONSHIP_ROUTES.some((pattern) => pattern.test(pathname))) return 'relationship'
  if (OPERATIONAL_ROUTES.some((pattern) => pattern.test(pathname))) return 'operational'
  if (ECONOMIC_ROUTES.some((pattern) => pattern.test(pathname))) return 'economic'
  return 'unknown'
}

export function buildDomainRuntimeSnapshot(input: {
  pathname: string
  authReady: boolean
  hydrationReady: boolean
  role: 'driver' | 'passenger' | null
  driverId: string | null
  passengerId: string | null
}): DomainRuntimeSnapshot {
  const { pathname, authReady, hydrationReady, role, driverId, passengerId } = input
  const routeKind = classifyDomainRoute(pathname)

  const relationshipIdentity = role === 'driver' ? Boolean(driverId) : role === 'passenger' ? Boolean(passengerId) : false
  const operationalIdentity = role === 'driver' && Boolean(driverId)
  const economicIdentity = role === 'driver' && Boolean(driverId)

  const relationshipEnabled = authReady && hydrationReady && routeKind === 'relationship' && relationshipIdentity
  const operationalEnabled = authReady && hydrationReady && routeKind === 'operational' && operationalIdentity
  const economicEnabled = authReady && hydrationReady && routeKind === 'economic' && economicIdentity
  const realtimeEnabled = operationalEnabled

  return {
    route: pathname,
    routeKind,
    authReady,
    hydrationReady,
    role,
    driverId,
    passengerId,
    domains: {
      relationship: {
        enabled: relationshipEnabled,
        isReady: relationshipEnabled,
        isHydrated: hydrationReady,
        hasIdentity: relationshipIdentity,
      },
      operational: {
        enabled: operationalEnabled,
        isReady: operationalEnabled,
        isHydrated: hydrationReady,
        hasIdentity: operationalIdentity,
      },
      economic: {
        enabled: economicEnabled,
        isReady: economicEnabled,
        isHydrated: hydrationReady,
        hasIdentity: economicIdentity,
      },
      realtime: {
        enabled: realtimeEnabled,
        isReady: realtimeEnabled,
        isHydrated: hydrationReady,
        hasIdentity: operationalIdentity,
      },
    },
  }
}
