/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { useNetworkContext } from './useNetworkContext'
import { useOnboardingContext } from './useOnboardingContext'
import { useRootDriverContext } from './useRootDriverContext'
import {
  networkContextFixtures,
  onboardingContextFixtures,
} from '../services/__mocks__/network.fixtures'

describe('V2 hooks (network / onboarding / rootDriver)', () => {
  const originalFlag = process.env.NEXT_PUBLIC_USE_MOCK_NETWORK
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_NETWORK = '1'
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_NETWORK = originalFlag
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
  })

  // ─── useNetworkContext ───────────────────────────────────────────────────

  describe('useNetworkContext', () => {
    it('does not fetch when actorId or actorType is null', () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: null, actorType: null }),
      )
      expect(result.current.context).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('loads DRIVER_TO_DRIVER context for a driver actor', async () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-me', actorType: 'driver' }),
      )
      await waitFor(() => expect(result.current.context).not.toBeNull())
      expect(result.current.context).toBe(networkContextFixtures.DRIVER_TO_DRIVER)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('loads PASSENGER_TO_PASSENGER context for a passenger actor', async () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'psg-me', actorType: 'passenger' }),
      )
      await waitFor(() => expect(result.current.context).not.toBeNull())
      expect(result.current.context).toBe(
        networkContextFixtures.PASSENGER_TO_PASSENGER,
      )
    })

    it('refresh() re-invokes the loader', async () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-me', actorType: 'driver' }),
      )
      await waitFor(() => expect(result.current.context).not.toBeNull())
      await act(async () => {
        await result.current.refresh()
      })
      expect(result.current.context).toBe(networkContextFixtures.DRIVER_TO_DRIVER)
    })
  })

  // ─── useOnboardingContext ────────────────────────────────────────────────

  describe('useOnboardingContext', () => {
    it('does nothing without slug or token', () => {
      const { result } = renderHook(() => useOnboardingContext({}))
      expect(result.current.context).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('resolves DRIVER_TO_PASSENGER by default for a public slug', async () => {
      const { result } = renderHook(() =>
        useOnboardingContext({ slug: 'pedro-motta' }),
      )
      await waitFor(() => expect(result.current.context).not.toBeNull())
      expect(result.current.context).toBe(
        onboardingContextFixtures.DRIVER_TO_PASSENGER,
      )
    })

    it('resolves PASSENGER_TO_PASSENGER when slug hints p2p', async () => {
      const { result } = renderHook(() =>
        useOnboardingContext({ slug: 'marcos-p2p' }),
      )
      await waitFor(() => expect(result.current.context).not.toBeNull())
      expect(result.current.context).toBe(
        onboardingContextFixtures.PASSENGER_TO_PASSENGER,
      )
    })
  })

  // ─── useRootDriverContext ────────────────────────────────────────────────

  describe('useRootDriverContext', () => {
    it('returns null when source is null', () => {
      const { result } = renderHook(() => useRootDriverContext(null))
      expect(result.current).toBeNull()
    })

    it('derives RootDriverContext from a NetworkContext (vehicleSummary)', () => {
      const { result } = renderHook(() =>
        useRootDriverContext(networkContextFixtures.DRIVER_TO_PASSENGER),
      )
      expect(result.current).not.toBeNull()
      expect(result.current?.id).toBe('drv-root')
      expect(result.current?.name).toBe('Pedro Motta')
      expect(result.current?.vehicleSummary).toBe('Toyota Corolla • PED0001')
      expect(result.current?.offersAssistedTransport).toBe(true)
    })

    it('passes through RootDriverContext when source is OnboardingContext', () => {
      const onboarding = onboardingContextFixtures.DRIVER_TO_DRIVER
      const { result } = renderHook(() => useRootDriverContext(onboarding))
      expect(result.current).toBe(onboarding.rootDriver)
    })
  })
})
