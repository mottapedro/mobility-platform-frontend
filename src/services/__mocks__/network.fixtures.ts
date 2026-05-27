// Deterministic fixtures for ALIADO Nacional V2 services.
// Used when NEXT_PUBLIC_USE_MOCK_NETWORK=1 and inside unit tests.
import type {
  FlowType,
  NetworkContext,
  OnboardingContext,
  NetworkDriverActor,
  NetworkPassengerActor,
  Genealogy,
} from '../../types/network-v2'

// ─── Shared cast helpers ───────────────────────────────────────────────────

const rootDriver: NetworkDriverActor = {
  id: 'drv-root',
  actorType: 'driver',
  name: 'Pedro Motta',
  slug: 'pedro-motta',
  region: 'SP',
  rating: 4.9,
  vehicle: { brand: 'Toyota', model: 'Corolla', plate: 'PED0001', category: 'sedan' },
  offersAssistedTransport: true,
  joinedAt: '2024-01-15T12:00:00.000Z',
}

const driverChild = (id: string, name: string, slug: string): NetworkDriverActor => ({
  id,
  actorType: 'driver',
  name,
  slug,
  region: 'SP',
  rating: 4.7,
  vehicle: { brand: 'Honda', model: 'Civic', plate: id.toUpperCase().slice(0, 7) },
  offersAssistedTransport: false,
  joinedAt: '2024-06-01T12:00:00.000Z',
})

const passenger = (id: string, name: string): NetworkPassengerActor => ({
  id,
  actorType: 'passenger',
  name,
  region: 'SP',
  ridesCount: 12,
  joinedAt: '2024-08-10T10:00:00.000Z',
})

// ─── Network fixtures per flow type ────────────────────────────────────────

const driverToDriverGenealogy: Genealogy = {
  me: driverChild('drv-me', 'João Silva', 'joao-silva'),
  ancestors: [rootDriver],
  descendants: [
    {
      actor: driverChild('drv-d1', 'Maria Souza', 'maria-souza'),
      depth: 1,
      absoluteDepth: 2,
      children: [
        { actor: driverChild('drv-d2', 'Ana Lima', 'ana-lima'), depth: 2, absoluteDepth: 3, children: [] },
      ],
    },
  ],
  lateral: [driverChild('drv-s1', 'Carlos Dias', 'carlos-dias')],
  operationalOwner: null,
}

const driverToPassengerGenealogy: Genealogy = {
  me: passenger('psg-me', 'Beatriz Costa'),
  ancestors: [rootDriver],
  descendants: [],
  lateral: [passenger('psg-s1', 'Lucas Pinto'), passenger('psg-s2', 'Renata Vaz')],
  operationalOwner: rootDriver,
}

const passengerToPassengerGenealogy: Genealogy = {
  me: passenger('psg-me', 'Beatriz Costa'),
  ancestors: [passenger('psg-a1', 'Marcos Tavares'), rootDriver],
  descendants: [
    {
      actor: passenger('psg-d1', 'Felipe Reis'),
      depth: 1,
      absoluteDepth: 2,
      children: [
        { actor: passenger('psg-d2', 'Carla Nunes'), depth: 2, absoluteDepth: 3, children: [] },
      ],
    },
  ],
  lateral: [passenger('psg-s1', 'Lucas Pinto')],
  operationalOwner: rootDriver,
}

export const networkContextFixtures: Record<FlowType, NetworkContext> = {
  DRIVER_TO_DRIVER: {
    flowType: 'DRIVER_TO_DRIVER',
    targetActorExpected: 'driver',
    rootDriver,
    genealogy: driverToDriverGenealogy,
    networkMetrics: {
      totalActors: 4,
      activeCount: 3,
      depth: 2,
      ridesFromNetwork: 87,
      estimatedRevenue: 2540.5,
      growth: { last7Days: 1, last30Days: 4 },
    },
  },
  DRIVER_TO_PASSENGER: {
    flowType: 'DRIVER_TO_PASSENGER',
    targetActorExpected: 'passenger',
    rootDriver,
    genealogy: driverToPassengerGenealogy,
    networkMetrics: {
      totalActors: 3,
      activeCount: 2,
      depth: 1,
      ridesFromNetwork: 28,
      growth: { last7Days: 2, last30Days: 6 },
    },
  },
  PASSENGER_TO_PASSENGER: {
    flowType: 'PASSENGER_TO_PASSENGER',
    targetActorExpected: 'passenger',
    rootDriver,
    genealogy: passengerToPassengerGenealogy,
    networkMetrics: {
      totalActors: 4,
      activeCount: 3,
      depth: 2,
      ridesFromNetwork: 12,
      growth: { last7Days: 0, last30Days: 3 },
    },
  },
}

// ─── Onboarding fixtures ───────────────────────────────────────────────────

export const onboardingContextFixtures: Record<FlowType, OnboardingContext> = {
  DRIVER_TO_DRIVER: {
    flowType: 'DRIVER_TO_DRIVER',
    expectedActor: 'driver',
    invite: {
      code: 'PEDRO-D2D',
      displayLabel: 'Convite de Pedro Motta para a rede de motoristas ALIADO',
      inviter: {
        id: rootDriver.id,
        actorType: 'driver',
        name: rootDriver.name,
        region: rootDriver.region,
      },
    },
    rootDriver: {
      id: rootDriver.id,
      name: rootDriver.name,
      slug: rootDriver.slug,
      region: rootDriver.region,
      vehicleSummary: 'Toyota Corolla • PED0001',
      rating: rootDriver.rating,
      offersAssistedTransport: rootDriver.offersAssistedTransport,
    },
  },
  DRIVER_TO_PASSENGER: {
    flowType: 'DRIVER_TO_PASSENGER',
    expectedActor: 'passenger',
    invite: {
      code: 'PEDRO-D2P',
      displayLabel: 'Pedro Motta convidou você para viajar com ALIADO',
      inviter: {
        id: rootDriver.id,
        actorType: 'driver',
        name: rootDriver.name,
        region: rootDriver.region,
      },
    },
    rootDriver: {
      id: rootDriver.id,
      name: rootDriver.name,
      slug: rootDriver.slug,
      region: rootDriver.region,
      vehicleSummary: 'Toyota Corolla • PED0001',
      rating: rootDriver.rating,
      offersAssistedTransport: rootDriver.offersAssistedTransport,
    },
  },
  PASSENGER_TO_PASSENGER: {
    flowType: 'PASSENGER_TO_PASSENGER',
    expectedActor: 'passenger',
    invite: {
      code: 'MARCOS-P2P',
      displayLabel: 'Marcos Tavares convidou você para a rede ALIADO',
      inviter: {
        id: 'psg-a1',
        actorType: 'passenger',
        name: 'Marcos Tavares',
        region: 'SP',
      },
    },
    rootDriver: {
      id: rootDriver.id,
      name: rootDriver.name,
      slug: rootDriver.slug,
      region: rootDriver.region,
      vehicleSummary: 'Toyota Corolla • PED0001',
      rating: rootDriver.rating,
      offersAssistedTransport: rootDriver.offersAssistedTransport,
    },
  },
}

// ─── Resolver helpers used by both services ────────────────────────────────

export function pickNetworkFixtureForActor(
  actorType: 'driver' | 'passenger',
): NetworkContext {
  return actorType === 'driver'
    ? networkContextFixtures.DRIVER_TO_DRIVER
    : networkContextFixtures.PASSENGER_TO_PASSENGER
}

export function pickOnboardingFixtureForSlugOrToken(
  input: { slug?: string; token?: string },
): OnboardingContext {
  const value = (input.slug ?? input.token ?? '').toLowerCase()
  if (value.includes('p2p')) return onboardingContextFixtures.PASSENGER_TO_PASSENGER
  if (value.includes('d2d')) return onboardingContextFixtures.DRIVER_TO_DRIVER
  // Default: driver inviting passenger (most common public landing).
  return onboardingContextFixtures.DRIVER_TO_PASSENGER
}
