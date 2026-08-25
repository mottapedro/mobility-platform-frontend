import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DriverOffersPage from './page'
import { useAuth } from '../../../contexts/AuthContext'
import { useOffers } from '../../../hooks/useOffers'
import { useOfferHistory } from '../../../hooks/useOfferHistory'
import type { OfferBookItem } from '../../../types'

jest.mock('../../../contexts/AuthContext')
jest.mock('../../../hooks/useOffers')
jest.mock('../../../hooks/useOfferHistory')
jest.mock('../../../services/rides', () => ({ respondOffer: jest.fn() }))
jest.mock('../../../contexts/domains/OperationalDomainProvider', () => ({
  useOperationalDomain: () => ({ activation: { enabled: true } }),
}))
jest.mock('../../../components/driver/DriverOfferCard', () => ({
  DriverOfferCard: ({ offer }: { offer: { id: string } }) => <div data-testid={`active-${offer.id}`}>Oferta ativa</div>,
}))
jest.mock('../../../components/driver/DriverOfferHistoryCard', () => ({
  DriverOfferHistoryCard: ({ item }: { item: OfferBookItem }) => (
    <div data-testid={`history-${item.offerId}`}>{item.bookStatus} · {item.driverReceivableAmountCents}</div>
  ),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseOffers = useOffers as jest.MockedFunction<typeof useOffers>
const mockUseOfferHistory = useOfferHistory as jest.MockedFunction<typeof useOfferHistory>

const authValue = {
  user: { id: 'user-1', name: 'Motorista', email: 'driver@test.com', role: 'driver' as const, driverId: 'driver-1' },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}

const historyItem: OfferBookItem = {
  offerId: 'offer-history-1',
  rideRequestId: 'ride-1',
  bookStatus: 'LOST',
  createdAt: '2026-08-25T10:00:00.000Z',
  expiresAt: '2099-08-25T11:00:00.000Z',
  respondedAt: null,
  rideStatus: 'PENDING',
  scheduledAt: '2026-08-25T12:00:00.000Z',
  origin: 'A',
  destination: 'B',
  driverReceivableAmountCents: 7366,
  selectedByOtherDriver: false,
  outcomeReason: 'ANOTHER_DRIVER_ACCEPTED',
  rideDistanceKm: null,
  driverToPickupDistanceKm: null,
}

describe('DriverOffersPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(authValue)
    mockUseOffers.mockReturnValue({ offers: [{
      id: 'active-1',
      status: 'PENDING',
      expiresAt: '2099-08-25T11:00:00.000Z',
      createdAt: '2026-08-25T10:00:00.000Z',
      rideRequest: {
        id: 'ride-active', origin: 'A', destination: 'B', scheduledAt: '2026-08-25T12:00:00.000Z', status: 'PENDING',
        passenger: { referredByDriverId: null, user: { name: 'Passageiro' } },
      },
    }], loading: false, error: null, refresh: jest.fn() })
    mockUseOfferHistory.mockReturnValue({
      items: [historyItem], loading: false, loadingMore: false, error: null,
      nextCursor: 'next', hasMore: true, loadMore: jest.fn().mockResolvedValue(true), refresh: jest.fn().mockResolvedValue(true),
    })
  })

  it('preserves the active inbox and does not load history until its tab is selected', async () => {
    render(<DriverOffersPage />)

    expect(screen.getByTestId('active-active-1')).toBeInTheDocument()
    expect(screen.queryByTestId('history-offer-history-1')).not.toBeInTheDocument()
    expect(mockUseOfferHistory).toHaveBeenCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }))

    await waitFor(() => expect(screen.getByTestId('history-offer-history-1')).toBeInTheDocument())
    expect(mockUseOfferHistory).toHaveBeenLastCalledWith(true)
    expect(screen.queryByTestId('active-active-1')).not.toBeInTheDocument()
  })

  it('offers cursor pagination without changing active offer actions', () => {
    const loadMore = jest.fn().mockResolvedValue(true)
    mockUseOfferHistory.mockReturnValue({
      items: [historyItem], loading: false, loadingMore: false, error: null,
      nextCursor: 'next', hasMore: true, loadMore, refresh: jest.fn().mockResolvedValue(true),
    })
    render(<DriverOffersPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    expect(loadMore).toHaveBeenCalledTimes(1)
  })

  it('shows a backend error without replacing already loaded history', () => {
    mockUseOfferHistory.mockReturnValue({
      items: [historyItem], loading: false, loadingMore: false, error: 'offline',
      nextCursor: null, hasMore: false, loadMore: jest.fn().mockResolvedValue(false), refresh: jest.fn().mockResolvedValue(false),
    })
    render(<DriverOffersPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }))
    expect(screen.getByText('offline')).toBeInTheDocument()
    expect(screen.getByTestId('history-offer-history-1')).toBeInTheDocument()
  })
})
