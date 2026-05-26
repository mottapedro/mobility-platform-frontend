/**
 * @jest-environment jsdom
 *
 * useNetworkContext — error-handling contract
 *
 * These tests cover the scenarios visible in the "Minha Rede" page when the
 * backend cannot serve a NetworkContext:
 *   • 410 Gone  → rede não inicializada (Pedro Paulo Motta in production)
 *   • 404       → rede não encontrada
 *   • generic   → mensagem genérica
 *   • refresh() → retries the fetch
 *   • window focus → re-fetches automatically
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { useNetworkContext } from './useNetworkContext'
import { ApiError } from '../services/api'

// ─── Mock fetchNetworkContext ────────────────────────────────────────────────
jest.mock('../services/network', () => ({
  fetchNetworkContext: jest.fn(),
}))
import { fetchNetworkContext } from '../services/network'
const mockFetch = fetchNetworkContext as jest.Mock

// ─── helpers ────────────────────────────────────────────────────────────────
function apiError(status: number, message = 'error') {
  return new ApiError(status, message)
}

// ─── suite ──────────────────────────────────────────────────────────────────
describe('useNetworkContext — error handling', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // ─── 410 Gone ─────────────────────────────────────────────────────────────
  describe('410 Gone — rede não inicializada', () => {
    it('sets the correct error message', async () => {
      mockFetch.mockRejectedValueOnce(apiError(410))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe(
        'Rede ainda não inicializada. Aguardando ativação pelo backend.',
      )
      expect(result.current.context).toBeNull()
    })

    it('leaves loading = false after 410', async () => {
      mockFetch.mockRejectedValueOnce(apiError(410))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.loading).toBe(false)
    })
  })

  // ─── 404 Not Found ────────────────────────────────────────────────────────
  describe('404 Not Found — rede não encontrada', () => {
    it('sets the 404-specific error message', async () => {
      mockFetch.mockRejectedValueOnce(apiError(404))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-unknown', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Rede não encontrada para este perfil.')
      expect(result.current.context).toBeNull()
    })
  })

  // ─── Generic error ────────────────────────────────────────────────────────
  describe('generic error (5xx / network failure)', () => {
    it('sets the generic error message for 500', async () => {
      mockFetch.mockRejectedValueOnce(apiError(500))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-x', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe(
        'Não foi possível carregar sua rede agora.',
      )
    })

    it('sets the generic error message for a plain network Error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-x', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe(
        'Não foi possível carregar sua rede agora.',
      )
    })
  })

  // ─── null params guard ───────────────────────────────────────────────────
  describe('null params — no fetch triggered', () => {
    it('stays idle when actorId is null', () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: null, actorType: 'driver' }),
      )
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.context).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('stays idle when actorType is null', () => {
      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-x', actorType: null }),
      )
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ─── refresh() after error ────────────────────────────────────────────────
  describe('refresh() — retries fetch after error', () => {
    it('clears error and succeeds on retry after 410', async () => {
      const successContext = { flowType: 'DRIVER_TO_DRIVER' } as never

      mockFetch
        .mockRejectedValueOnce(apiError(410))
        .mockResolvedValueOnce(successContext)

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.error).not.toBeNull())
      expect(result.current.error).toContain('não inicializada')

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.context).toBe(successContext)
    })

    it('stays in error state if retry also fails', async () => {
      mockFetch
        .mockRejectedValueOnce(apiError(410))
        .mockRejectedValueOnce(apiError(410))

      const { result } = renderHook(() =>
        useNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' }),
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toBe(
        'Rede ainda não inicializada. Aguardando ativação pelo backend.',
      )
      expect(result.current.context).toBeNull()
    })
  })

  // ─── window focus re-fetch ────────────────────────────────────────────────
  describe('window focus — re-fetches on visibility change', () => {
    it('calls fetchNetworkContext again when window regains focus', async () => {
      mockFetch.mockResolvedValue({ flowType: 'DRIVER_TO_DRIVER' } as never)

      renderHook(() =>
        useNetworkContext({ actorId: 'drv-pedro', actorType: 'driver' }),
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    })
  })
})
