/**
 * @jest-environment jsdom
 *
 * useGenealogyProjection — contract tests
 *
 * Verifies the hook's full lifecycle:
 *   • null driverId  → no fetch called
 *   • valid driverId → fetchGenealogyProjection called with correct args
 *   • re-fires       → when driverId changes from null → real id
 *   • loading state  → true during fetch, false after
 *   • 404            → specific error message
 *   • generic error  → fallback message
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGenealogyProjection } from './useGenealogyProjection'
import { ApiError } from '../services/api'

// ─── Mock fetchGenealogyProjection ───────────────────────────────────────────
jest.mock('../services/network', () => ({
  fetchGenealogyProjection: jest.fn(),
}))
import { fetchGenealogyProjection } from '../services/network'
const mockFetch = fetchGenealogyProjection as jest.Mock

// ─── Minimal fixture ─────────────────────────────────────────────────────────
const projectionFixture = {
  rootDriver: { id: 'drv-root', name: 'Pedro Motta', experienceLevel: null, networkLevel: 1, publicSlug: 'pedro-motta', referralCode: 'PEDRO' },
  stats: { totalNodes: 3, totalEdges: 2, maxDepth: 2, appliedDepthLimit: 5 },
  nodes: [
    { actorId: 'drv-root', actorType: 'DRIVER', name: 'Pedro Motta', flowType: 'DRIVER_TO_DRIVER', level: 0, rootDriverId: 'drv-root', parentId: null, publicSlug: 'pedro-motta', referralCode: 'PEDRO', networkLevel: 1, createdAt: '2024-01-01T00:00:00.000Z' },
    { actorId: 'drv-a', actorType: 'DRIVER', name: 'Alice', flowType: 'DRIVER_TO_DRIVER', level: 1, rootDriverId: 'drv-root', parentId: 'drv-root', publicSlug: null, referralCode: null, networkLevel: 2, createdAt: '2024-02-01T00:00:00.000Z' },
    { actorId: 'psg-b', actorType: 'PASSENGER', name: 'Bob', flowType: 'DRIVER_TO_PASSENGER', level: 1, rootDriverId: 'drv-root', parentId: 'drv-root', publicSlug: null, referralCode: null, networkLevel: 1, createdAt: '2024-03-01T00:00:00.000Z' },
  ],
  edges: [
    { sourceActorId: 'drv-root', targetActorId: 'drv-a', flowType: 'DRIVER_TO_DRIVER' },
    { sourceActorId: 'drv-root', targetActorId: 'psg-b', flowType: 'DRIVER_TO_PASSENGER' },
  ],
  levels: [
    { depth: 0, nodeIds: ['drv-root'] },
    { depth: 1, nodeIds: ['drv-a', 'psg-b'] },
  ],
  metrics: { totalDrivers: 2, totalPassengers: 1, totalRelationships: 2, totalD2D: 1, totalD2P: 1, totalP2P: 0, maxDepth: 1 },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function apiError(status: number, message = 'error') {
  return new ApiError(status, message)
}

// ─── suite ───────────────────────────────────────────────────────────────────
describe('useGenealogyProjection', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('does NOT call fetchGenealogyProjection when driverId is null', async () => {
    mockFetch.mockResolvedValue(projectionFixture)

    const { result } = renderHook(() =>
      useGenealogyProjection({ driverId: null }),
    )

    // Give it a tick to confirm no call was made
    await act(async () => {})

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.projection).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('calls fetchGenealogyProjection with the correct driverId', async () => {
    mockFetch.mockResolvedValueOnce(projectionFixture)

    renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root' }),
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith('drv-root', { maxDepth: undefined })
  })

  it('passes maxDepth option to the service', async () => {
    mockFetch.mockResolvedValueOnce(projectionFixture)

    renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root', maxDepth: 3 }),
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith('drv-root', { maxDepth: 3 })
  })

  it('sets projection on success and clears loading', async () => {
    mockFetch.mockResolvedValueOnce(projectionFixture)

    const { result } = renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root' }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.projection).toEqual(projectionFixture)
    expect(result.current.error).toBeNull()
  })

  it('re-fires when driverId changes from null to a real id', async () => {
    mockFetch.mockResolvedValue(projectionFixture)

    const { result, rerender } = renderHook(
      ({ driverId }: { driverId: string | null }) =>
        useGenealogyProjection({ driverId }),
      { initialProps: { driverId: null as string | null } },
    )

    // no fetch on null
    await act(async () => {})
    expect(mockFetch).not.toHaveBeenCalled()

    // change to real id
    rerender({ driverId: 'drv-root' })

    await waitFor(() => expect(result.current.projection).toEqual(projectionFixture))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('sets a specific message on 404', async () => {
    mockFetch.mockRejectedValueOnce(apiError(404))

    const { result } = renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root' }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Árvore genealógica não encontrada.')
    expect(result.current.projection).toBeNull()
  })

  it('sets a fallback message on any other error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network failure'))

    const { result } = renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root' }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Não foi possível carregar a árvore da rede.')
  })

  it('refresh() retries the fetch and clears the previous error', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce(projectionFixture)

    const { result } = renderHook(() =>
      useGenealogyProjection({ driverId: 'drv-root' }),
    )

    await waitFor(() => expect(result.current.error).not.toBeNull())

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.projection).toEqual(projectionFixture)
    expect(result.current.error).toBeNull()
  })

  it('does not refetch on window focus; refresh remains explicit', async () => {
    mockFetch.mockResolvedValue(projectionFixture)

    renderHook(() => useGenealogyProjection({ driverId: 'drv-root' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    await act(async () => {})

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
