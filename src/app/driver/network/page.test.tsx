import { render, screen } from '@testing-library/react'
import DriverNetworkPage from './page'
import { useDriverNetwork } from '../../../hooks/useDriverNetwork'
import { useAuth } from '../../../contexts/AuthContext'

jest.mock('../../../hooks/useDriverNetwork')
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => null,
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/driver/network',
}))

const mockUseDriverNetwork = useDriverNetwork as jest.MockedFunction<typeof useDriverNetwork>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const baseAuth = {
  user: { id: 'u1', name: 'Pedro', email: 'p@p.com', role: 'driver' as const, driverId: 'driver-1' },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}

describe('DriverNetworkPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(baseAuth)
  })

  it('renders stat cards when network data is loaded', () => {
    mockUseDriverNetwork.mockReturnValue({
      data: {
        totalPassengers: 5,
        ridesCompleted: 18,
        estimatedRevenue: 850.5,
        recentPassengers: [
          { id: 'p1', name: 'Ana Costa', ridesCount: 4, lastRideAt: '2026-05-10T12:00:00Z' },
          { id: 'p2', name: 'Bruno Lima', ridesCount: 1, lastRideAt: null },
        ],
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('Ana Costa')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()
    // Frequent passenger badge
    expect(screen.getByText('Fiel')).toBeInTheDocument()
    // Growth banner
    expect(screen.getByText('Rede crescendo!')).toBeInTheDocument()
  })

  it('renders empty state when totalPassengers is 0', () => {
    mockUseDriverNetwork.mockReturnValue({
      data: {
        totalPassengers: 0,
        ridesCompleted: 0,
        estimatedRevenue: 0,
        recentPassengers: [],
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    // All three stat cards show 0 / R$ 0,00
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)
    // No growth banner when 0 passengers
    expect(screen.queryByText('Rede crescendo!')).not.toBeInTheDocument()
  })

  it('shows loading skeleton when fetching', () => {
    mockUseDriverNetwork.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    render(<DriverNetworkPage />)

    // Skeletons are pulse divs — page heading still visible
    expect(screen.getByText('Minha Rede')).toBeInTheDocument()
    // No passenger names in loading state
    expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument()
  })
})
