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
  referralCode: 'pedro-motta-zn-elite',
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

// ─── Backend URL precedence ─────────────────────────────────────────────────

describe('backend URL precedence', () => {
  it('prioriza d2pUrl do backend sobre fallback por referralCode', () => {
    setupAuth()
    const backendD2pUrl = 'https://aliado.com/invite/d2p/backend-issued'
    render(<DriverReferralCard d2pUrl={backendD2pUrl} />)
    expect(capturedProps['d2p']?.displayUrl).toBe(backendD2pUrl)
    expect(capturedProps['d2p']?.fullUrl).toBe(backendD2pUrl)
  })

  it('prioriza d2dUrl do backend sobre fallback por referralCode', () => {
    setupAuth()
    const backendD2dUrl = 'https://aliado.com/invite/d2d/backend-issued'
    render(<DriverReferralCard d2dUrl={backendD2dUrl} />)
    expect(capturedProps['d2d']?.displayUrl).toBe(backendD2dUrl)
    expect(capturedProps['d2d']?.fullUrl).toBe(backendD2dUrl)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'false')
  })
})

// ─── referralCode fallback ───────────────────────────────────────────────────

describe('referralCode fallback', () => {
  it('usa fallback /invite/d2p/{referralCode} quando backend não envia d2pUrl', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(capturedProps['d2p']?.displayUrl).toBe('/invite/d2p/pedro-motta-zn-elite')
  })

  it('usa fallback /invite/d2d/{referralCode} quando backend não envia d2dUrl', () => {
    setupAuth()
    render(<DriverReferralCard />)
    expect(capturedProps['d2d']?.displayUrl).toBe('/invite/d2d/pedro-motta-zn-elite')
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'false')
  })

  it('não renderiza URL truncada por publicSlug quando referralCode inclui sufixo oficial', () => {
    setupAuth({ publicSlug: 'pedro-motta', referralCode: 'pedro-motta-zn-elite' })
    render(<DriverReferralCard />)
    expect(capturedProps['d2p']?.displayUrl).toBe('/invite/d2p/pedro-motta-zn-elite')
    expect(capturedProps['d2d']?.displayUrl).toBe('/invite/d2d/pedro-motta-zn-elite')
    expect(capturedProps['d2p']?.displayUrl).not.toBe('/invite/d2p/pedro-motta')
    expect(capturedProps['d2d']?.displayUrl).not.toBe('/invite/d2d/pedro-motta')
  })
})

// ─── No URL => disabled ─────────────────────────────────────────────────────

describe('no URL state', () => {
  it('desabilita o card D2D quando não há d2dUrl nem referralCode', () => {
    setupAuth({ referralCode: undefined })
    render(<DriverReferralCard d2pUrl="https://example.com/d2p" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })

  it('usa placeholder quando d2dUrl não está disponível', () => {
    setupAuth({ referralCode: undefined })
    render(<DriverReferralCard />)
    expect(capturedProps['d2d']?.displayUrl).toBe('/convite/motorista')
  })

  it('não envia texto WhatsApp sem d2dUrl válida', () => {
    setupAuth({ referralCode: undefined })
    render(<DriverReferralCard />)
    expect(capturedProps['d2d']?.whatsappText).toBe('')
  })
})

describe('D2D distinctness', () => {
  it('desabilita D2D quando backend envia mesma URL de D2P e não há referralCode fallback', () => {
    setupAuth({ referralCode: undefined })
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

  it('desabilita D2D quando capabilities.canInviteDrivers = false', () => {
    setupAuth()
    render(<DriverReferralCard capabilities={caps({ canInviteDrivers: false })} />)
    expect(screen.queryByTestId('referral-card-d2d')).not.toBeInTheDocument()
  })

  it('mantém D2D desabilitado quando capabilities.canInviteDrivers = true mas sem d2dUrl/referralCode', () => {
    setupAuth({ referralCode: undefined })
    render(<DriverReferralCard capabilities={caps({ canInviteDrivers: true })} d2pUrl="https://aliado.com/d2p" />)
    expect(screen.getByTestId('referral-card-d2d')).toHaveAttribute('data-disabled', 'true')
  })

  it('desabilita D2P quando capabilities.canInvitePassengers = false', () => {
    setupAuth()
    render(<DriverReferralCard capabilities={caps({ canInvitePassengers: false })} />)
    expect(screen.queryByTestId('referral-card-d2p')).not.toBeInTheDocument()
  })
})

// ─── D2P behavior ────────────────────────────────────────────────────────────

describe('D2P behavior', () => {
  it('usa d2pUrl do backend quando fornecida', () => {
    setupAuth()
    const backendUrl = 'https://aliado.com/invite/d2p/backend-url'
    render(<DriverReferralCard d2pUrl={backendUrl} />)
    expect(capturedProps['d2p']?.displayUrl).toBe(backendUrl)
  })

  it('não renderiza card D2P quando sem d2pUrl e sem referralCode', () => {
    setupAuth({ referralCode: undefined })
    const { container } = render(<DriverReferralCard />)
    expect(screen.queryByTestId('referral-card-d2p')).not.toBeInTheDocument()
    expect(container.firstChild).not.toBeNull()
  })
})
