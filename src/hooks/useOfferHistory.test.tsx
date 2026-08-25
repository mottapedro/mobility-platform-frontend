/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { useOfferHistory } from './useOfferHistory'
import { getMyOfferHistory } from '../services/drivers'
import type { OfferBookItem } from '../types'

jest.mock('../services/drivers', () => ({
  getMyOfferHistory: jest.fn(),
}))

const mockGetMyOfferHistory = getMyOfferHistory as jest.MockedFunction<typeof getMyOfferHistory>

function item(offerId: string): OfferBookItem {
  return {
    offerId,
    rideRequestId: `ride-${offerId}`,
    bookStatus: 'ACTIVE',
    createdAt: '2026-08-25T10:00:00.000Z',
    expiresAt: '2026-08-25T11:00:00.000Z',
    respondedAt: null,
    rideStatus: 'PENDING',
    scheduledAt: '2026-08-25T12:00:00.000Z',
    origin: 'A',
    destination: 'B',
    driverReceivableAmountCents: 7366,
    selectedByOtherDriver: false,
    outcomeReason: 'ACTIVE_OFFER',
    rideDistanceKm: 10,
    driverToPickupDistanceKm: 2,
  }
}

describe('useOfferHistory', () => {
  beforeEach(() => mockGetMyOfferHistory.mockReset())

  it('loads the first page from the authenticated history service', async () => {
    mockGetMyOfferHistory.mockResolvedValue({ items: [item('A')], nextCursor: 'cursor-1' })

    const { result } = renderHook(() => useOfferHistory(true, 2))

    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(mockGetMyOfferHistory).toHaveBeenCalledWith({ limit: 2 })
    expect(result.current.hasMore).toBe(true)
  })

  it('sends nextCursor, appends in backend order and deduplicates offerId', async () => {
    mockGetMyOfferHistory
      .mockResolvedValueOnce({ items: [item('A'), item('B')], nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ items: [item('B'), item('C')], nextCursor: null })

    const { result } = renderHook(() => useOfferHistory(true, 2))
    await waitFor(() => expect(result.current.items).toHaveLength(2))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockGetMyOfferHistory).toHaveBeenLastCalledWith({ cursor: 'cursor-1', limit: 2 })
    expect(result.current.items.map((entry) => entry.offerId)).toEqual(['A', 'B', 'C'])
    expect(result.current.hasMore).toBe(false)
  })

  it('keeps loaded items when the next page fails', async () => {
    mockGetMyOfferHistory
      .mockResolvedValueOnce({ items: [item('A')], nextCursor: 'cursor-1' })
      .mockRejectedValueOnce(new Error('offline'))

    const { result } = renderHook(() => useOfferHistory(true))
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.items.map((entry) => entry.offerId)).toEqual(['A'])
    expect(result.current.error).toBe('offline')
  })

  it('does not fetch while the history tab is disabled', () => {
    renderHook(() => useOfferHistory(false))
    expect(mockGetMyOfferHistory).not.toHaveBeenCalled()
  })
})
