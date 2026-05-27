import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DriverNetworkPage from './page'
import { useNetworkContext } from '../../../hooks/useNetworkContext'
import { useAuth } from '../../../contexts/AuthContext'
import type { NetworkContext } from '../../../types/network-v2'
import { getDriverOffers, getDriverRides } from '../../../services/drivers'

jest.mock('../../../hooks/useNetworkContext')
jest.mock('../../../hooks/useGenealogyProjection', () => ({
  useGenealogyProjection: () => ({ projection: null, loading: false, error: null, refresh: jest.fn() }),
}))
jest.mock('../../../services/drivers', () => ({
  getDriverOffers: jest.fn(),
  getDriverRides: jest.fn(),
}))
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => null,
}))
jest.mock('../../../components/driver/DriverReferralCard', () => ({
  DriverReferralCard: () => <div data-testid="referral-card" />,
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/driver/network',
  useSearchParams: () => ({ get: () => null }),
}))

const mockUseNetworkContext = useNetworkContext as jest.MockedFunction<typeof useNetworkContext>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetDriverOffers = getDriverOffers as jest.MockedFunction<typeof getDriverOffers>
const mockGetDriverRides = getDriverRides as jest.MockedFunction<typeof getDriverRides>

const baseAuth = {
  user: { id: 'u1', name: 'Pedro', email: 'p@p.com', role: 'driver' as const, driverId: 'driver-1' },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}

const d2dContext: NetworkContext = {
  flowType: 'DRIVER_TO_DRIVER',
  targetActorExpected: 'driver',
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
    me: { id: 'drv-me', actorType: 'driver', name: 'João Silva' },
    ancestors: [
      { id: 'drv-root', actorType: 'driver', name: 'Pedro Motta' },
    ],
    descendants: [
      {
        actor: { id: 'drv-d1', actorType: 'driver', name: 'Maria Souza' },
        depth: 1,
        children: [],
      },
    ],
    lateral: [
      { id: 'drv-s1', actorType: 'driver', name: 'Carlos Dias' },
    ],
    operationalOwner: null,
  },
  networkMetrics: {
    totalActors: 4,
    activeCount: 3,
    depth: 2,
    ridesFromNetwork: 87,
    estimatedRevenue: 2540.5,
  },
}

const d2pContext: NetworkContext = {
  ...d2dContext,
  flowType: 'DRIVER_TO_PASSENGER',
  targetActorExpected: 'passenger',
}

describe('DriverNetworkPage (V2)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseAuth.mockReturnValue(baseAuth)
    mockGetDriverOffers.mockReset()
    mockGetDriverRides.mockReset()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders NetworkExperience with backend-governed context', () => {
    mockUseNetworkContext.mockReturnValue({
      context: d2dContext,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    expect(screen.getByText('Minha Rede')).toBeInTheDocument()
    const experience = screen.getByTestId('network-experience')
    expect(experience).toBeInTheDocument()
    expect(experience).toHaveAttribute('data-flow-type', 'DRIVER_TO_DRIVER')
  })

  it('shows loading skeleton while fetching', () => {
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)
    expect(screen.getByTestId('network-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('network-experience')).not.toBeInTheDocument()
  })

  it('renders error banner with retry button when fetch fails', () => {
    const refresh = jest.fn()
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: false,
      error: 'Não foi possível carregar sua rede agora.',
      refresh,
    })

    render(<DriverNetworkPage />)
    expect(screen.getByTestId('network-error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('renders empty state when no driverId is available', () => {
    mockUseAuth.mockReturnValue({ ...baseAuth, user: { ...baseAuth.user, driverId: undefined } })
    mockUseNetworkContext.mockReturnValue({
      context: null,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)
    expect(screen.getByText(/Perfil de motorista não encontrado/i)).toBeInTheDocument()
  })

  it('does not call offers or rides services while switching driver network tabs', async () => {
    mockUseNetworkContext.mockReturnValue({
      context: d2dContext,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    await waitFor(() => {
      expect(screen.getByTestId('network-experience')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Árvore' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lateral' }))
    fireEvent.click(screen.getByRole('button', { name: 'Social' }))

    jest.advanceTimersByTime(5000)

    expect(mockGetDriverOffers).not.toHaveBeenCalled()
    expect(mockGetDriverRides).not.toHaveBeenCalled()
  })

  it('does not call offers or rides services while switching passenger network tabs', async () => {
    mockUseNetworkContext.mockReturnValue({
      context: d2pContext,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    await waitFor(() => {
      expect(screen.getByTestId('network-experience')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Operacional' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lateral' }))
    fireEvent.click(screen.getByRole('button', { name: 'Social' }))

    jest.advanceTimersByTime(5000)

    expect(mockGetDriverOffers).not.toHaveBeenCalled()
    expect(mockGetDriverRides).not.toHaveBeenCalled()
  })
})
