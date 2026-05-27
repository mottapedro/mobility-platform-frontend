import { fetchNetworkContext, fetchGenealogyProjection } from './network'
import { networkContextFixtures } from './__mocks__/network.fixtures'

describe('fetchNetworkContext', () => {
  const originalFetch = global.fetch
  const originalMockFlag = process.env.NEXT_PUBLIC_USE_MOCK_NETWORK
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.NEXT_PUBLIC_USE_MOCK_NETWORK = originalMockFlag
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    jest.resetAllMocks()
  })

  describe('when NEXT_PUBLIC_USE_MOCK_NETWORK=1', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCK_NETWORK = '1'
    })

    it('returns DRIVER_TO_DRIVER fixture for a driver actor', async () => {
      const ctx = await fetchNetworkContext({ actorId: 'drv-me', actorType: 'driver' })
      expect(ctx).toBe(networkContextFixtures.DRIVER_TO_DRIVER)
      expect(ctx.flowType).toBe('DRIVER_TO_DRIVER')
      expect(ctx.targetActorExpected).toBe('driver')
    })

    it('returns PASSENGER_TO_PASSENGER fixture for a passenger actor', async () => {
      const ctx = await fetchNetworkContext({ actorId: 'psg-me', actorType: 'passenger' })
      expect(ctx).toBe(networkContextFixtures.PASSENGER_TO_PASSENGER)
      expect(ctx.flowType).toBe('PASSENGER_TO_PASSENGER')
      expect(ctx.targetActorExpected).toBe('passenger')
    })

    it('never calls fetch when the mock flag is on', async () => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock as unknown as typeof fetch
      await fetchNetworkContext({ actorId: 'drv-me', actorType: 'driver' })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('when NEXT_PUBLIC_USE_MOCK_NETWORK is unset', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_USE_MOCK_NETWORK
    })

    it('calls GET /network/context with actorId and actorType', async () => {
      const expected = networkContextFixtures.DRIVER_TO_PASSENGER
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(expected)),
      } as unknown as Response)
      global.fetch = fetchMock as unknown as typeof fetch

      const ctx = await fetchNetworkContext({ actorId: 'drv-root', actorType: 'driver' })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const calledUrl = fetchMock.mock.calls[0][0] as string
      expect(calledUrl).toContain('/network/context')
      expect(calledUrl).toContain('actorId=drv-root')
      expect(calledUrl).toContain('actorType=driver')
      expect(ctx).toEqual(expected)
    })

    // ─── Backend V2 adapter ─────────────────────────────────────────────────
    // The backend now returns { state, actorId, actorType, ownership, ... }
    // instead of the legacy { flowType, genealogy, networkMetrics } shape.
    // adaptBackendV2() must normalise the wire format so components stay clean.

    function mockFetch(body: unknown) {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(body)),
      } as unknown as Response)
      global.fetch = fetchMock as unknown as typeof fetch
      return fetchMock
    }

    const baseBackendV2 = {
      state: 'ACTIVE',
      actorId: 'drv-pedro',
      actorType: 'DRIVER',
      rootDriverId: 'drv-pedro',
      isRoot: true,
      networkLevel: 'ELITE',
      publicSlug: 'pedro-motta',
      referralCode: 'PMT001',
      relationships: { totals: { total: 3, driverToDriver: 2, driverToPassenger: 1, passengerToPassenger: 0 } },
      ownership: {
        totalDriversInTree: 2,
        totalPassengersInTree: 5,
        completedRidesAttributedToTree: 87,
        settledRevenueShareCents: 254050,
      },
      capabilities: {
        canInvitePassengers: true,
        canInviteDrivers: true,
        canReceiveRewards: true,
        canExpandNetwork: true,
        skillCodes: [],
      },
      inviteUrls: {
        driverToPassenger: 'https://aliado.app/invite/passenger/pedro-motta',
        driverToDriver: 'https://aliado.app/invite/driver/pedro-motta',
      },
    }

    describe('backend V2 shape adaptation (state field present)', () => {
      it('derives flowType DRIVER_TO_DRIVER for DRIVER actorType', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.flowType).toBe('DRIVER_TO_DRIVER')
      })

      it('derives flowType DRIVER_TO_PASSENGER for PASSENGER actorType', async () => {
        mockFetch({ ...baseBackendV2, actorType: 'PASSENGER' })
        const ctx = await fetchNetworkContext({ actorId: 'psg-1', actorType: 'passenger' })
        expect(ctx.flowType).toBe('DRIVER_TO_PASSENGER')
      })

      it('maps targetActorExpected from actorType', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.targetActorExpected).toBe('driver')
      })

      it('passes capabilities through unchanged', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.capabilities).toEqual(baseBackendV2.capabilities)
      })

      it('passes inviteUrls through unchanged', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.inviteUrls).toEqual(baseBackendV2.inviteUrls)
      })

      it('maps missing inviteUrls to null', async () => {
        mockFetch({ ...baseBackendV2, inviteUrls: undefined })
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.inviteUrls).toBeNull()
      })

      it('maps ownership → networkMetrics.totalActors (drivers + passengers)', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        // 2 drivers + 5 passengers = 7
        expect(ctx.networkMetrics.totalActors).toBe(7)
      })

      it('maps completedRidesAttributedToTree → networkMetrics.ridesFromNetwork', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.networkMetrics.ridesFromNetwork).toBe(87)
      })

      it('converts settledRevenueShareCents to BRL (÷100)', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.networkMetrics.estimatedRevenue).toBeCloseTo(2540.5)
      })

      it('builds genealogy.me from actorId and publicSlug', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.genealogy.me.id).toBe('drv-pedro')
        expect(ctx.genealogy.me.actorType).toBe('driver')
        expect(ctx.genealogy.me.name).toBe('pedro-motta')
      })

      it('returns empty arrays for genealogy tree (not yet from backend)', async () => {
        mockFetch(baseBackendV2)
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.genealogy.ancestors).toEqual([])
        expect(ctx.genealogy.descendants).toEqual([])
        expect(ctx.genealogy.lateral).toEqual([])
      })

      it('handles missing ownership gracefully (defaults to 0)', async () => {
        mockFetch({ ...baseBackendV2, ownership: null })
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.networkMetrics.totalActors).toBe(0)
        expect(ctx.networkMetrics.ridesFromNetwork).toBe(0)
        expect(ctx.networkMetrics.estimatedRevenue).toBeUndefined()
      })

      it('handles null capabilities (no capabilities flag)', async () => {
        mockFetch({ ...baseBackendV2, capabilities: null })
        const ctx = await fetchNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' })
        expect(ctx.capabilities).toBeNull()
      })
    })

    describe('legacy shape pass-through (no state field)', () => {
      it('returns the legacy shape as-is when flowType is top-level', async () => {
        const legacy = networkContextFixtures.DRIVER_TO_DRIVER
        mockFetch(legacy)
        const ctx = await fetchNetworkContext({ actorId: 'drv-root', actorType: 'driver' })
        expect(ctx.flowType).toBe('DRIVER_TO_DRIVER')
        expect(ctx.genealogy).toBeDefined()
        expect(ctx.networkMetrics).toBeDefined()
      })
    })
  })
})

describe('fetchGenealogyProjection', () => {
  const originalFetch = global.fetch
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    jest.resetAllMocks()
  })

  function mockFetch(body: unknown) {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response)
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  const minimalProjection = {
    rootDriver: { id: 'drv-root', name: 'Pedro Paulo', experienceLevel: 'SENIOR', networkLevel: 3, publicSlug: 'pedro-motta', referralCode: 'PMT001' },
    stats: { totalNodes: 1, totalEdges: 0, maxDepth: 0, appliedDepthLimit: 5 },
    nodes: [
      { actorId: 'drv-root', actorType: 'DRIVER', name: 'Pedro Paulo', flowType: 'DRIVER_TO_DRIVER', level: 0, rootDriverId: 'drv-root', parentId: null, publicSlug: 'pedro-motta', referralCode: 'PMT001', networkLevel: 3, isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
    ],
    edges: [],
    levels: [{ depth: 0, nodeIds: ['drv-root'] }],
    metrics: { totalDrivers: 1, totalPassengers: 0, totalRelationships: 0, totalD2D: 0, totalD2P: 0, totalP2P: 0, maxDepth: 0 },
  }

  it('calls GET /drivers/:id/network/genealogy', async () => {
    const fetchMock = mockFetch(minimalProjection)
    await fetchGenealogyProjection('drv-root')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/drivers/drv-root/network/genealogy')
    expect(calledUrl).not.toContain('maxDepth')
  })

  it('appends maxDepth query param when provided', async () => {
    const fetchMock = mockFetch(minimalProjection)
    await fetchGenealogyProjection('drv-root', { maxDepth: 3 })
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('maxDepth=3')
  })

  it('returns the projection as-is from the backend', async () => {
    mockFetch(minimalProjection)
    const result = await fetchGenealogyProjection('drv-root')
    expect(result.rootDriver.id).toBe('drv-root')
    expect(result.nodes).toHaveLength(1)
    expect(result.edges).toHaveLength(0)
    expect(result.levels).toHaveLength(1)
    expect(result.metrics.totalDrivers).toBe(1)
  })

  it('encodes driverId in the URL', async () => {
    const fetchMock = mockFetch(minimalProjection)
    await fetchGenealogyProjection('drv/special id')
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).not.toContain('drv/special id')
    expect(calledUrl).toContain('drv%2Fspecial%20id')
  })

  it('level shape matches { depth, nodeIds }', async () => {
    mockFetch(minimalProjection)
    const result = await fetchGenealogyProjection('drv-root')
    expect(result.levels[0]).toMatchObject({ depth: 0, nodeIds: ['drv-root'] })
  })
})
