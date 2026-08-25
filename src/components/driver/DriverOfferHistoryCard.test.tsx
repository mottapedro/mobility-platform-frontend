import { render, screen } from '@testing-library/react'
import { DriverOfferHistoryCard } from './DriverOfferHistoryCard'
import type { OfferBookItem, OfferBookStatus } from '../../types'

function item(bookStatus: OfferBookStatus): OfferBookItem {
  return {
    offerId: `offer-${bookStatus}`,
    rideRequestId: `ride-${bookStatus}`,
    bookStatus,
    // Deliberately contradictory values prove that bookStatus is authoritative.
    createdAt: '2026-08-25T10:00:00.000Z',
    expiresAt: '2099-08-25T11:00:00.000Z',
    respondedAt: null,
    rideStatus: 'PENDING',
    scheduledAt: '2026-08-25T12:00:00.000Z',
    origin: 'Origem',
    destination: 'Destino',
    driverReceivableAmountCents: 7366,
    selectedByOtherDriver: false,
    outcomeReason: bookStatus === 'LOST' ? 'ANOTHER_DRIVER_ACCEPTED' : 'ACTIVE_OFFER',
    rideDistanceKm: null,
    driverToPickupDistanceKm: null,
  }
}

describe('DriverOfferHistoryCard', () => {
  it.each([
    ['ACTIVE', 'Oferta ativa'],
    ['ACCEPTED', 'Aceita'],
    ['REJECTED', 'Recusada'],
    ['EXPIRED', 'Expirada'],
    ['LOST', 'Encerrada'],
    ['UNAVAILABLE', 'Indisponível'],
  ] as const)('renders the backend %s status as %s', (status, label) => {
    render(<DriverOfferHistoryCard item={item(status)} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('renders LOST even when fields could look active to a client', () => {
    render(<DriverOfferHistoryCard item={item('LOST')} />)
    expect(screen.getByText('Encerrada')).toBeInTheDocument()
    expect(screen.getByText('Outro motorista confirmou esta corrida.')).toBeInTheDocument()
    expect(screen.queryByText('Oferta ativa')).not.toBeInTheDocument()
  })

  it('formats driver amount from cents without recalculating pricing', () => {
    render(<DriverOfferHistoryCard item={item('ACCEPTED')} />)
    expect(screen.getByText('R$ 73,66')).toBeInTheDocument()
    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Destino')).toBeInTheDocument()
  })
})
