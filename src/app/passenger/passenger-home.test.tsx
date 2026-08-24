import { render, screen } from '@testing-library/react'
import PassengerHomePage from './page'
import { getRidesByPassenger } from '../../services/rides'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'João Silva', passengerId: 'pass-1' } }),
}))

jest.mock('../../hooks/useAlliedDriver', () => ({
  useAlliedDriver: () => ({ alliedDriver: null, loading: false, error: null }),
}))

jest.mock('../../components/passenger/AlliedDriverCard', () => ({
  AlliedDriverCard: ({ onRequestRide }: { onRequestRide: () => void }) => (
    <div data-testid="allied-driver-card">
      <button onClick={onRequestRide}>Solicitar corrida (card)</button>
    </div>
  ),
}))

jest.mock('../../services/rides', () => ({
  getRidesByPassenger: jest.fn(),
}))

const mockGetRidesByPassenger = getRidesByPassenger as jest.MockedFunction<typeof getRidesByPassenger>

describe('PassengerHomePage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGetRidesByPassenger.mockReset()
    mockGetRidesByPassenger.mockResolvedValue([])
    localStorage.clear()
  })

  it('renders a greeting with user first name', () => {
    render(<PassengerHomePage />)
    expect(screen.getByText(/João/i)).toBeInTheDocument()
  })

  it('renders the allied driver card section', () => {
    render(<PassengerHomePage />)
    expect(screen.getByTestId('allied-driver-card')).toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(<PassengerHomePage />)
    expect(screen.getByText('Solicitar corrida')).toBeInTheDocument()
    expect(screen.getByText('Minhas corridas')).toBeInTheDocument()
  })

  it('does not render recent rides section when localStorage is empty', () => {
    render(<PassengerHomePage />)
    expect(screen.queryByText(/corridas recentes/i)).not.toBeInTheDocument()
  })

  it('renders recent rides from the authenticated passenger collection', async () => {
    mockGetRidesByPassenger.mockResolvedValue([
      {
        id: 'aaaa-1111-bbbb-2222-000000000001',
        status: 'COMPLETED',
        origin: 'Origem',
        destination: 'Destino',
      } as never,
      {
        id: 'cccc-3333-dddd-4444-000000000002',
        status: 'IN_PROGRESS',
        origin: 'Origem',
        destination: 'Destino',
      } as never,
    ])

    render(<PassengerHomePage />)

    expect(await screen.findByText(/corridas recentes/i)).toBeInTheDocument()
    expect(await screen.findByText('Corrida finalizada')).toBeInTheDocument()
    expect(await screen.findByText('🚗 A caminho')).toBeInTheDocument()
  })

  it('ignores stale passengerRideIds and does not fetch them', async () => {
    localStorage.setItem('passengerRideIds', JSON.stringify(['ghost-0000-0000-0000-000000000000']))
    mockGetRidesByPassenger.mockResolvedValue([])

    render(<PassengerHomePage />)

    await screen.findByText('Você ainda não tem corridas.')
    expect(screen.queryByText(/corridas recentes/i)).not.toBeInTheDocument()
    expect(mockGetRidesByPassenger).toHaveBeenCalledTimes(1)
  })
})
