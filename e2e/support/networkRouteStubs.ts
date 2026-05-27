import type { Page, Route } from '@playwright/test'

type ParsedRequest = {
  pathname: string
  searchParams: URLSearchParams
}

export async function tryFulfillDriverNetworkContext(
  route: Route,
  request: ParsedRequest,
): Promise<boolean> {
  if (request.pathname !== '/network/context') return false
  if (request.searchParams.get('actorType') !== 'driver') return false

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      flowType: 'DRIVER_TO_DRIVER',
      targetActorExpected: 'driver',
      rootDriver: {
        id: 'drv-root',
        actorType: 'driver',
        name: 'Pedro Motta',
        slug: 'pedro-motta',
        region: 'SP',
        rating: 4.9,
        offersAssistedTransport: true,
      },
      genealogy: {
        me: { id: 'drv-1', actorType: 'driver', name: 'Pedro' },
        ancestors: [],
        descendants: [
          {
            actor: { id: 'drv-2', actorType: 'driver', name: 'Maria' },
            depth: 1,
            children: [],
          },
        ],
        lateral: [{ id: 'drv-3', actorType: 'driver', name: 'Carlos' }],
        operationalOwner: null,
      },
      networkMetrics: {
        totalActors: 3,
        activeCount: 3,
        depth: 2,
        ridesFromNetwork: 10,
        estimatedRevenue: 120,
      },
    }),
  })

  return true
}

export async function tryFulfillPassengerNetworkContext(
  route: Route,
  request: ParsedRequest,
): Promise<boolean> {
  if (request.pathname !== '/network/context') return false
  if (request.searchParams.get('actorType') !== 'passenger') return false

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      flowType: 'PASSENGER_TO_PASSENGER',
      targetActorExpected: 'passenger',
      rootDriver: {
        id: 'drv-root',
        actorType: 'driver',
        name: 'Pedro Motta',
        slug: 'pedro-motta',
        region: 'SP',
        rating: 4.9,
        offersAssistedTransport: true,
      },
      genealogy: {
        me: { id: 'psg-1', actorType: 'passenger', name: 'Beatriz' },
        ancestors: [{ id: 'drv-root', actorType: 'driver', name: 'Pedro Motta' }],
        descendants: [],
        lateral: [{ id: 'psg-2', actorType: 'passenger', name: 'Lucas' }],
        operationalOwner: {
          id: 'drv-root',
          actorType: 'driver',
          name: 'Pedro Motta',
          slug: 'pedro-motta',
          region: 'SP',
        },
      },
      networkMetrics: {
        totalActors: 2,
        activeCount: 2,
        depth: 1,
        ridesFromNetwork: 5,
        estimatedRevenue: 0,
      },
    }),
  })

  return true
}

export async function tryFulfillDriverGenealogy(
  route: Route,
  request: ParsedRequest,
): Promise<boolean> {
  if (!/\/drivers\/[^/]+\/network\/genealogy(?:\?.*)?$/.test(request.pathname)) return false

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      rootDriver: {
        id: 'drv-root',
        name: 'Pedro Motta',
        experienceLevel: null,
        networkLevel: 1,
        publicSlug: 'pedro-motta',
        referralCode: 'pedro-code',
      },
      stats: { totalNodes: 2, totalEdges: 1, maxDepth: 1, appliedDepthLimit: 5 },
      nodes: [
        {
          actorId: 'drv-root',
          actorType: 'DRIVER',
          name: 'Pedro Motta',
          flowType: 'DRIVER_TO_DRIVER',
          level: 0,
          rootDriverId: 'drv-root',
          parentId: null,
          publicSlug: 'pedro-motta',
          referralCode: 'pedro-code',
          networkLevel: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          actorId: 'drv-2',
          actorType: 'DRIVER',
          name: 'Maria',
          flowType: 'DRIVER_TO_DRIVER',
          level: 1,
          rootDriverId: 'drv-root',
          parentId: 'drv-root',
          publicSlug: 'maria',
          referralCode: null,
          networkLevel: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      edges: [{ sourceActorId: 'drv-root', targetActorId: 'drv-2', flowType: 'DRIVER_TO_DRIVER' }],
      levels: [{ depth: 0, nodeIds: ['drv-root'] }, { depth: 1, nodeIds: ['drv-2'] }],
      metrics: {
        totalDrivers: 2,
        totalPassengers: 0,
        totalRelationships: 1,
        totalD2D: 1,
        totalD2P: 0,
        totalP2P: 0,
        maxDepth: 1,
      },
    }),
  })

  return true
}

export async function stubDriverNetworkContext(page: Page) {
  await page.route('**/network/context**', async (route) => {
    const parsed = new URL(route.request().url())
    const fulfilled = await tryFulfillDriverNetworkContext(route, {
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
    })

    if (!fulfilled) await route.continue()
  })
}

export async function stubPassengerNetworkContext(page: Page) {
  await page.route('**/network/context**', async (route) => {
    const parsed = new URL(route.request().url())
    const fulfilled = await tryFulfillPassengerNetworkContext(route, {
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
    })

    if (!fulfilled) await route.continue()
  })
}

export async function stubDriverGenealogy(page: Page) {
  await page.route('**/drivers/*/network/genealogy**', async (route) => {
    const parsed = new URL(route.request().url())
    const fulfilled = await tryFulfillDriverGenealogy(route, {
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
    })

    if (!fulfilled) await route.continue()
  })
}