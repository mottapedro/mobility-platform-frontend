import { fetchOnboardingContext } from './onboarding'
import { onboardingContextFixtures } from './__mocks__/network.fixtures'

describe('fetchOnboardingContext', () => {
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

  it('throws when neither slug nor token is provided', async () => {
    await expect(fetchOnboardingContext({})).rejects.toThrow(/slug or token/)
  })

  describe('when NEXT_PUBLIC_USE_MOCK_NETWORK=1', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCK_NETWORK = '1'
    })

    it('returns DRIVER_TO_PASSENGER fixture by default for a public slug', async () => {
      const ctx = await fetchOnboardingContext({ slug: 'pedro-motta' })
      expect(ctx).toBe(onboardingContextFixtures.DRIVER_TO_PASSENGER)
      expect(ctx.expectedActor).toBe('passenger')
      expect(ctx.invite?.displayLabel).toBeTruthy()
    })

    it('returns PASSENGER_TO_PASSENGER fixture when slug hints p2p', async () => {
      const ctx = await fetchOnboardingContext({ slug: 'marcos-p2p' })
      expect(ctx).toBe(onboardingContextFixtures.PASSENGER_TO_PASSENGER)
    })

    it('returns DRIVER_TO_DRIVER fixture when token hints d2d', async () => {
      const ctx = await fetchOnboardingContext({ token: 'INVITE-D2D-123' })
      expect(ctx).toBe(onboardingContextFixtures.DRIVER_TO_DRIVER)
      expect(ctx.expectedActor).toBe('driver')
    })

    it('does not call fetch when mock flag is on', async () => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock as unknown as typeof fetch
      await fetchOnboardingContext({ slug: 'pedro-motta' })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('when NEXT_PUBLIC_USE_MOCK_NETWORK is unset', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_USE_MOCK_NETWORK
    })

    it('calls GET /onboarding/context/:slug as path param', async () => {
      const expected = onboardingContextFixtures.DRIVER_TO_PASSENGER
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(expected)),
      } as unknown as Response)
      global.fetch = fetchMock as unknown as typeof fetch

      const ctx = await fetchOnboardingContext({ slug: 'pedro-motta' })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('/onboarding/context/pedro-motta')
      expect(url).not.toContain('slug=')
      expect(ctx).toEqual(expected)
    })

    it('calls GET /onboarding/context?token=... for opaque tokens', async () => {
      const expected = onboardingContextFixtures.DRIVER_TO_DRIVER
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(expected)),
      } as unknown as Response)
      global.fetch = fetchMock as unknown as typeof fetch

      await fetchOnboardingContext({ token: 'abc-123' })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('token=abc-123')
      expect(url).not.toContain('/onboarding/context/abc-123')
    })
  })
})
