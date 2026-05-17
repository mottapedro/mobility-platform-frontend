import { fireEvent, render, screen } from '@testing-library/react'
import PassengerNetworkPage from './page'
import { usePassengerNetwork } from '../../../hooks/usePassengerNetwork'
import { useAuth } from '../../../contexts/AuthContext'

jest.mock('../../../hooks/usePassengerNetwork')
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => null,
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

const mockUsePassengerNetwork = usePassengerNetwork as jest.MockedFunction<typeof usePassengerNetwork>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const auth = {
  user: {
    id: 'user-1',
    name: 'Maria Lucia Souza',
    email: 'maria@test.com',
    role: 'passenger' as const,
    passengerId: 'passenger-1',
  },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}

describe('PassengerNetworkPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseAuth.mockReturnValue(auth)
  })

  it('renders loading state using the shared network tree', () => {
    mockUsePassengerNetwork.mockReturnValue({
      data: null,
      hierarchy: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)

    expect(screen.getByRole('status', { name: 'Carregando rede de passageiros' })).toBeInTheDocument()
  })

  it('renders error state using the shared network tree', () => {
    mockUsePassengerNetwork.mockReturnValue({
      data: null,
      hierarchy: null,
      loading: false,
      error: 'Nao foi possivel carregar sua rede agora.',
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)

    expect(screen.getByText('Nao foi possivel carregar sua rede agora.')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    mockUsePassengerNetwork.mockReturnValue({
      data: {
        totalReferrals: 0,
        level1: [],
        level2: [],
        level3: [],
        recentReferrals: [],
      },
      hierarchy: {
        me: { id: 'passenger-1', name: 'Maria Lucia Souza', referralCode: 'maria-lucia-7x2a' },
        referredBy: null,
        referrals: [],
        totalPassengers: 1,
        maxDepth: 0,
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)

    expect(screen.getByText('Nenhum passageiro indicado ainda.')).toBeInTheDocument()
    expect(screen.getByText('/r/maria-lucia-7x2a')).toBeInTheDocument()
  })

  it('renders success state with passenger cards and stats', () => {
    mockUsePassengerNetwork.mockReturnValue({
      data: {
        totalReferrals: 2,
        activeReferrals: 1,
        ridesFromNetwork: 8,
        growth: 2,
        level1: ['p2'],
        level2: ['p3'],
        level3: [],
        recentReferrals: [
          { id: 'p2', name: 'Ana Costa', status: 'active', ridesCount: 8, createdAt: '2026-05-10T12:00:00Z' },
          { id: 'p3', name: 'Bruno Lima', createdAt: '2026-05-11T12:00:00Z' },
        ],
      },
      hierarchy: {
        me: { id: 'passenger-1', name: 'Maria Lucia Souza', referralCode: 'maria-lucia-7x2a' },
        referredBy: null,
        referrals: [
          { id: 'p2', name: 'Ana Costa', networkLevel: 1 },
          { id: 'p3', name: 'Bruno Lima', networkLevel: 1 },
        ],
        totalPassengers: 3,
        maxDepth: 1,
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)

    expect(screen.getByText('Ana Costa')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('8 rides')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Estatísticas' }))
    expect(screen.getByText('Rides da rede')).toBeInTheDocument()
  })
})
