import { render, screen } from '@testing-library/react'
import { DriverReferralCard } from './DriverReferralCard'
import { useAuth } from '../../contexts/AuthContext'
import type { NetworkCapabilityContext } from '../../types/network-v2'

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('../../contexts/AuthContext')

// Capture props passed to each ReferralLinkCard instance keyed by D2P / D2D.
const capturedProps: Record<string, Record<string, unknown>> = {}
jest.mock('../network/ReferralLinkCard', () => ({
  ReferralLinkCard: (props: {
    eyebrow: string
    disabled?: boolean
    displayUrl?: string
    fullUrl?: string
    whatsappText?: string
  }) => {
    const key = props.eyebrow.includes('D2D') ? 'd2d' : 'd2p'
    capturedProps[key] = props as Record<string, unknown>
    return (
      <div
        data-testid={`referral-card-${key}`}
        data-disabled={props.disabled ? 'true' : 'false'}
        data-url={props.displayUrl}
      />
    )
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const baseUser = {
  id: 'u1',
  name: 'Pedro Paulo Motta',
  email: 'p@p.com',
  role: 'driver' as const,
  driverId: 'drv-1',
  publicSlug: 'pedro-motta',
}

function setupAuth(overrides: Partial<typeof baseUser> = {}) {
  mockUseAuth.mockReturnValue({
    user: { ...baseUser, ...overrides },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.keys(capturedProps).forEach((k) => delete capturedProps[k])
})

// ─── D2D fallback seguro (sem reuse de D2P/publicSlug) ─────────────────────

describe('D2D — fallback seguro quando backend não envia URL', () => {
  it('desabilita o card D2D quando d2dUrl ausente mesmo com publicSlug', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })

  it('usa placeholder quando d2dUrl não está disponível', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(capturedProps['d2d']?.displayUrl).toBe('/convite/motorista')
  })

  it('não envia texto WhatsApp sem d2dUrl válida', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(capturedProps['d2d']?.whatsappText).toBe('')
  })
})

// ─── D2D sem publicSlug e sem d2dUrl ─────────────────────────────────────────

describe('D2D — desabilitado quando sem publicSlug e sem d2dUrl', () => {
  it('desabilita o card D2D quando não há publicSlug nem d2dUrl', () => {
    setupAuth({ publicSlug: undefined })
    // DriverReferralCard early-returns when !user.publicSlug && !d2pUrl
    // So the component renders null. We render with d2pUrl to bypass that guard.
    render(<DriverReferralCard d2pUrl="https://example.com/d2p" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })
})

// ─── D2D com URL explícita do backend ────────────────────────────────────────

describe('D2D — URL explícita do backend', () => {
  it('usa d2dUrl quando fornecida pelo backend', () => {
    setupAuth()
    const backendD2dUrl = 'https://api.aliado.com/convite/motorista/abc123'
    render(<DriverReferralCard d2dUrl={backendD2dUrl} />)
    expect(capturedProps['d2d']?.displayUrl).toBe(backendD2dUrl)
    expect(capturedProps['d2d']?.fullUrl).toBe(backendD2dUrl)
  })

  it('ativa o card D2D quando d2dUrl é fornecida', () => {
    setupAuth({ publicSlug: undefined })
    render(<DriverReferralCard d2dUrl="https://aliado.com/d2d/xyz" d2pUrl="https://aliado.com/d2p" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'false')
  })

  it('desabilita D2D quando backend envia mesma URL de D2P', () => {
    setupAuth()
    render(<DriverReferralCard d2pUrl="https://aliado.com/invite/x" d2dUrl="https://aliado.com/invite/x" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })
})

// ─── Capabilities governam quando presentes ───────────────────────────────────

describe('capabilities — backend governa quando presente', () => {
  const caps = (overrides: Partial<NetworkCapabilityContext>): NetworkCapabilityContext => ({
    canInvitePassengers: true,
    canInviteDrivers: true,
    canReceiveRewards: true,
    canExpandNetwork: true,
    skillCodes: [],
    ...overrides,
  })

  it('desabilita D2D quando capabilities.canInviteDrivers = false (mesmo com publicSlug)', () => {
    setupAuth()
    render(<DriverReferralCard capabilities={caps({ canInviteDrivers: false })} />)
    expect(screen.queryByTestId('referral-card-d2d')).not.toBeInTheDocument()
  })

  it('mantém D2D desabilitado quando capabilities.canInviteDrivers = true mas sem d2dUrl', () => {
    setupAuth({ publicSlug: undefined })
    render(<DriverReferralCard capabilities={caps({ canInviteDrivers: true })} d2pUrl="https://aliado.com/d2p" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })

  it('desabilita D2P quando capabilities.canInvitePassengers = false', () => {
    setupAuth()
    render(<DriverReferralCard capabilities={caps({ canInvitePassengers: false })} />)
    expect(screen.queryByTestId('referral-card-d2p')).not.toBeInTheDocument()
  })
})

// ─── D2P — regressão ──────────────────────────────────────────────────────────

describe('D2P — comportamento inalterado', () => {
  it('renderiza D2P com /r/{slug} quando publicSlug existe', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(capturedProps['d2p']?.displayUrl).toBe('/r/pedro-motta')
  })

  it('usa d2pUrl do backend quando fornecida', () => {
    setupAuth()
    const backendUrl = 'https://aliado.com/r/pedro-motta-backend'
    render(<DriverReferralCard d2pUrl={backendUrl} />)
    expect(capturedProps['d2p']?.displayUrl).toBe(backendUrl)
  })

  it('não renderiza quando sem publicSlug e sem d2pUrl', () => {
    setupAuth({ publicSlug: undefined })
    const { container } = render(<DriverReferralCard />)
    expect(container.firstChild).toBeNull()
  })
})
