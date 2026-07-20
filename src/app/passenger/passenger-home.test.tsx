import { render, screen } from '@testing-library/react'
import PassengerHomePage from './page'
import { getRide } from '../../services/rides'

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
  getRide: jest.fn(),
}))

const mockGetRide = getRide as jest.MockedFunction<typeof getRide>

describe('PassengerHomePage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGetRide.mockReset()
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

  it('renders recent rides fetched by id, with their real status', async () => {
    localStorage.setItem(
      'passengerRideIds',
      JSON.stringify(['aaaa-1111-bbbb-2222-000000000001', 'cccc-3333-dddd-4444-000000000002']),
    )
    mockGetRide.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        status: id.endsWith('001') ? 'COMPLETED' : 'IN_PROGRESS',
        origin: 'Origem',
        destination: 'Destino',
      } as never),
    )

    render(<PassengerHomePage />)

    expect(await screen.findByText(/corridas recentes/i)).toBeInTheDocument()
    expect(await screen.findByText('Corrida finalizada')).toBeInTheDocument()
    expect(await screen.findByText('🚗 A caminho')).toBeInTheDocument()
  })

  it('does not render a ride that failed to fetch', async () => {
    localStorage.setItem('passengerRideIds', JSON.stringify(['ghost-0000-0000-0000-000000000000']))
    mockGetRide.mockRejectedValue(new Error('404'))

    render(<PassengerHomePage />)

    await screen.findByText('Você ainda não tem corridas.')
    expect(screen.queryByText(/corridas recentes/i)).not.toBeInTheDocument()
  })
})
