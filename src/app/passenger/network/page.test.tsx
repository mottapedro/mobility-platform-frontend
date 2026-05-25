import { render, screen } from '@testing-library/react'
import PassengerNetworkPage from './page'
import { useNetworkContext } from '../../../hooks/useNetworkContext'
import { useAuth } from '../../../contexts/AuthContext'
import type { NetworkContext } from '../../../types/network-v2'

jest.mock('../../../hooks/useNetworkContext')
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => null,
}))
jest.mock('../../../components/passenger/PassengerReferralCard', () => ({
  PassengerReferralCard: () => <div data-testid="referral-card" />,
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/passenger/network',
  useSearchParams: () => ({ get: () => null }),
}))

const mockUseNetworkContext = useNetworkContext as jest.MockedFunction<typeof useNetworkContext>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const baseAuth = {
  user: {
    id: 'u1',
    name: 'Lia',
    email: 'lia@p.com',
    role: 'passenger' as const,
    passengerId: 'pass-1',
    referralCode: 'liagold',
  },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}

const d2pContext: NetworkContext = {
  flowType: 'DRIVER_TO_PASSENGER',
  targetActorExpected: 'passenger',
  rootDriver: {
    id: 'drv-root',
    actorType: 'driver',
    name: 'Pedro Motta',
    slug: 'pedro-motta',
    region: 'SP',
    rating: 4.9,
    offersAssistedTransport: true,
  },
  genealogy: {
    me: { id: 'pass-me', actorType: 'passenger', name: 'Lia Aliada' },
    ancestors: [
      { id: 'drv-root', actorType: 'driver', name: 'Pedro Motta' },
    ],
    descendants: [
      {
        actor: { id: 'pass-d1', actorType: 'passenger', name: 'Ana Convidada' },
        depth: 1,
        children: [],
      },
    ],
    lateral: [
      { id: 'pass-s1', actorType: 'passenger', name: 'Lucas Pinto' },
    ],
    operationalOwner: {
      id: 'drv-root',
      actorType: 'driver',
      name: 'Pedro Motta',
    },
  },
  networkMetrics: {
    totalActors: 3,
    activeCount: 2,
    depth: 1,
    ridesFromNetwork: 28,
  },
}

describe('PassengerNetworkPage (V2)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(baseAuth)
  })

  it('renders NetworkExperience with backend-governed context', () => {
    mockUseNetworkContext.mockReturnValue({
      context: d2pContext,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)

    expect(screen.getByText('Minha Rede')).toBeInTheDocument()
    const experience = screen.getByTestId('network-experience')
    expect(experience).toBeInTheDocument()
    expect(experience).toHaveAttribute('data-flow-type', 'DRIVER_TO_PASSENGER')
  })

  it('shows loading skeleton while fetching', () => {
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)
    expect(screen.getByTestId('network-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('network-experience')).not.toBeInTheDocument()
  })

  it('renders error banner with retry button when fetch fails', () => {
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: false,
      error: 'Não foi possível carregar sua rede agora.',
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)
    expect(screen.getByTestId('network-error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('renders empty state when no passengerId is available', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: { ...baseAuth.user, passengerId: undefined },
    })
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<PassengerNetworkPage />)
    expect(screen.getByText(/Perfil de passageiro não encontrado/i)).toBeInTheDocument()
  })
})
