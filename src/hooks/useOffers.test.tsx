/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { useOffers } from './useOffers'

jest.mock('../services/drivers', () => ({
  getDriverOffers: jest.fn(),
}))

import { getDriverOffers } from '../services/drivers'

const mockGetDriverOffers = getDriverOffers as jest.MockedFunction<typeof getDriverOffers>

describe('useOffers', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockGetDriverOffers.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does not fetch when driverId is invalid string', async () => {
    renderHook(() => useOffers('undefined'))

    await waitFor(() => {
      expect(mockGetDriverOffers).not.toHaveBeenCalled()
    })

    jest.advanceTimersByTime(4000)
    expect(mockGetDriverOffers).not.toHaveBeenCalled()
  })

  it('fetches and starts polling when driverId is valid', async () => {
    mockGetDriverOffers.mockResolvedValue([])
    const setIntervalSpy = jest.spyOn(global, 'setInterval')

    renderHook(() => useOffers('drv_123'))

    await waitFor(() => {
      expect(mockGetDriverOffers).toHaveBeenCalledTimes(1)
    })

    const pollMs = Number(setIntervalSpy.mock.calls[0]?.[1] ?? 0)
    expect(pollMs).toBeGreaterThan(0)

    await act(async () => {
      jest.advanceTimersByTime(pollMs + 100)
    })

    expect(mockGetDriverOffers).toHaveBeenCalledTimes(2)
    setIntervalSpy.mockRestore()
  })
})
