import { fetchNetworkContext } from './network'
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
  })
})
