import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PassengerNetworkTree } from './PassengerNetworkTree'
import type { PassengerNetwork, PassengerNetworkHierarchy } from '../../types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PASSENGER_ID = 'pax-1'
const PASSENGER_NAME = 'Alice Teste'

const emptyHierarchy: PassengerNetworkHierarchy = {
  me: { id: PASSENGER_ID, name: PASSENGER_NAME, referralCode: 'alice-teste', referrals: [] },
  referredBy: null,
  referrals: [],
  totalPassengers: 0,
  maxDepth: 0,
}

const hierarchyWithReferral: PassengerNetworkHierarchy = {
  me: { id: PASSENGER_ID, name: PASSENGER_NAME, referralCode: 'alice-teste', referrals: [] },
  referredBy: null,
  referrals: [
    { id: 'ref-1', name: 'Bob Referido', referralCode: null, referrals: [] },
  ],
  totalPassengers: 1,
  maxDepth: 1,
}

const mockNetwork: PassengerNetwork = {
  totalReferrals: 0,
  activeReferrals: 0,
  ridesFromNetwork: 0,
  growth: 0,
  growthPercent: 0,
  level1: [],
  level2: [],
  level3: [],
  recentReferrals: [],
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PassengerNetworkTree — empty state', () => {
  it('renders premium empty state when hierarchy has no referrals', () => {
    render(
      <PassengerNetworkTree
        passengerId={PASSENGER_ID}
        passengerName={PASSENGER_NAME}
        network={mockNetwork}
        hierarchy={emptyHierarchy}
        loading={false}
        error={null}
      />,
    )

    expect(screen.getByTestId('passenger-empty-state')).toBeInTheDocument()
    expect(screen.getByText('Sua rede ainda está começando')).toBeInTheDocument()
    expect(screen.getByText(/Compartilhe seu link para convidar passageiros/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copiar link/i })).toBeInTheDocument()
  })

  it('does not show error state when hierarchy is empty', () => {
    render(
      <PassengerNetworkTree
        passengerId={PASSENGER_ID}
        passengerName={PASSENGER_NAME}
        network={null}
        hierarchy={null}
        loading={false}
        error={null}
      />,
    )

    expect(screen.queryByText(/não foi possível/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('passenger-empty-state')).toBeInTheDocument()
  })

  it('does not show empty state when hierarchy has referrals', () => {
    render(
      <PassengerNetworkTree
        passengerId={PASSENGER_ID}
        passengerName={PASSENGER_NAME}
        network={mockNetwork}
        hierarchy={hierarchyWithReferral}
        loading={false}
        error={null}
      />,
    )

    expect(screen.queryByTestId('passenger-empty-state')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Referido')).toBeInTheDocument()
  })

  it('shows error state on failed fetch (real HTTP error)', () => {
    render(
      <PassengerNetworkTree
        passengerId={PASSENGER_ID}
        passengerName={PASSENGER_NAME}
        network={null}
        hierarchy={null}
        loading={false}
        error="Não foi possível carregar sua rede agora."
      />,
    )

    expect(screen.getByText(/não foi possível carregar sua rede agora/i)).toBeInTheDocument()
    expect(screen.queryByTestId('passenger-empty-state')).not.toBeInTheDocument()
  })

  it('Copiar link button calls clipboard with referral URL', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(
      <PassengerNetworkTree
        passengerId={PASSENGER_ID}
        passengerName={PASSENGER_NAME}
        network={null}
        hierarchy={null}
        loading={false}
        error={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Copiar link/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/r/alice-teste'))
    })

    expect(await screen.findByText(/Copiado!/)).toBeInTheDocument()
  })
})
