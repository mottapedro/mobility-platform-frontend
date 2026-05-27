/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react'
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

    renderHook(() => useOffers('drv_123'))

    await waitFor(() => {
      expect(mockGetDriverOffers).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(2100)

    await waitFor(() => {
      expect(mockGetDriverOffers).toHaveBeenCalledTimes(2)
    })
  })
})
