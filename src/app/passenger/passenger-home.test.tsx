import { render, screen } from '@testing-library/react'
import PassengerHomePage from './page'

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

describe('PassengerHomePage', () => {
  beforeEach(() => {
    mockPush.mockClear()
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

  it('renders recent rides from localStorage', () => {
    localStorage.setItem(
      'passengerRideIds',
      JSON.stringify(['aaaa-1111-bbbb-2222', 'cccc-3333-dddd-4444']),
    )
    render(<PassengerHomePage />)
    expect(screen.getByText(/corridas recentes/i)).toBeInTheDocument()
  })
})
