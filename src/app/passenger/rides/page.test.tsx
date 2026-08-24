import { render, screen } from '@testing-library/react'

import PassengerRidesPage from './page'
import { getRidesByPassenger } from '../../../services/rides'

const mockPush = jest.fn()
const mockUsePassenger = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('../../../hooks/usePassenger', () => ({
  usePassenger: (...args: unknown[]) => mockUsePassenger(...args),
}))

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { passengerId: 'passenger-1', name: 'Ana Passageira', role: 'passenger' },
  }),
}))

jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => <div>header</div>,
}))

jest.mock('../../../services/rides', () => ({
  getRidesByPassenger: jest.fn(),
}))

const mockGetRidesByPassenger = getRidesByPassenger as jest.MockedFunction<typeof getRidesByPassenger>

describe('PassengerRidesPage dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockUsePassenger.mockReset()
    mockGetRidesByPassenger.mockReset()
    mockGetRidesByPassenger.mockResolvedValue([])
  })

  it('renders the allied driver relationship card with backend data', () => {
    mockUsePassenger.mockReturnValue({
      data: {
        referredByDriver: {
          id: 'driver-1',
          user: { name: 'Pedro Motta', phone: '21900000001' },
          vehicles: [{ id: 'vehicle-1', brand: 'Toyota', model: 'Corolla', plate: 'ABC1234' }],
        },
      },
      loading: false,
      error: null,
    })

    render(<PassengerRidesPage />)

    expect(screen.getByText('Meu motorista aliado')).toBeInTheDocument()
    expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByText('Atendimento sob consulta')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Solicitar corrida' }).length).toBeGreaterThan(0)
  })

  it('renders an empty allied-driver state when no relationship exists', async () => {
    mockUsePassenger.mockReturnValue({
      data: { referredByDriver: null },
      loading: false,
      error: null,
    })

    render(<PassengerRidesPage />)

    expect(screen.getByText('Nenhum motorista aliado vinculado')).toBeInTheDocument()
    expect(await screen.findByText(/nenhuma corrida/i)).toBeInTheDocument()
  })
})
