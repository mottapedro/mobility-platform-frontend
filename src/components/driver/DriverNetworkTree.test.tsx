import { render, screen, fireEvent } from '@testing-library/react'
import { DriverNetworkTree } from './DriverNetworkTree'
import type { DriverNetworkHierarchy } from '../../types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const meNode = {
  id: 'me-1',
  name: 'Pedro Motta',
  region: 'zn',
  depth: 0,
  referrals: [],
}

const hierarchyWithReferrals: DriverNetworkHierarchy = {
  me: meNode,
  referredBy: null,
  referrals: [
    { id: 'ref-1', name: 'João Silva', region: 'zs', depth: 1, referrals: [] },
    { id: 'ref-2', name: 'Carla Mendes', region: 'zo', depth: 1, referrals: [] },
  ],
  totalDrivers: 2,
  maxDepth: 1,
}

const emptyHierarchy: DriverNetworkHierarchy = {
  me: meNode,
  referredBy: null,
  referrals: [],
  totalDrivers: 0,
  maxDepth: 0,
}

const hierarchyWithReferredBy: DriverNetworkHierarchy = {
  me: meNode,
  referredBy: { id: 'rb-1', name: 'Carlos Souza', depth: -1, referrals: [] },
  referrals: [],
  totalDrivers: 0,
  maxDepth: 0,
}

// ─── Loading ──────────────────────────────────────────────────────────────────

describe('DriverNetworkTree — loading', () => {
  it('shows a loading spinner when loading=true', () => {
    render(<DriverNetworkTree hierarchy={null} loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('hides driver data while loading', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} loading={true} />)
    expect(screen.queryByText('Pedro Motta')).not.toBeInTheDocument()
  })
})

// ─── Error fallback ───────────────────────────────────────────────────────────

describe('DriverNetworkTree — error fallback', () => {
  it('shows the error message when error prop is set', () => {
    render(<DriverNetworkTree hierarchy={null} error="Falha ao carregar rede" />)
    expect(screen.getByText('Falha ao carregar rede')).toBeInTheDocument()
  })

  it('renders a retry button when onRetry is provided', () => {
    render(
      <DriverNetworkTree hierarchy={null} error="Erro" onRetry={jest.fn()} />,
    )
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = jest.fn()
    render(<DriverNetworkTree hierarchy={null} error="Erro" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not render driver tree while in error state', () => {
    render(
      <DriverNetworkTree hierarchy={hierarchyWithReferrals} error="Erro" />,
    )
    expect(screen.queryByText('Pedro Motta')).not.toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('DriverNetworkTree — empty state', () => {
  it('shows the empty-referrals message when there are no referrals', () => {
    render(<DriverNetworkTree hierarchy={emptyHierarchy} />)
    expect(screen.getByText(/nenhum motorista indicado/i)).toBeInTheDocument()
  })

  it('still renders the "me" card in the empty state', () => {
    render(<DriverNetworkTree hierarchy={emptyHierarchy} />)
    expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
  })
})

// ─── Cards ────────────────────────────────────────────────────────────────────

describe('DriverNetworkTree — cards', () => {
  it('renders the "me" card with the "Você" badge', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
    expect(screen.getByText('Você')).toBeInTheDocument()
  })

  it('renders referral driver cards', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Carla Mendes')).toBeInTheDocument()
  })

  it('renders the referredBy card with the "Te indicou" badge', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferredBy} />)
    expect(screen.getByText('Carlos Souza')).toBeInTheDocument()
    expect(screen.getByText('Te indicou')).toBeInTheDocument()
  })

  it('shows region labels on cards that have a region', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getAllByText(/zona norte/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows depth level pill on non-root referral nodes', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getAllByText(/nível 1/i).length).toBeGreaterThanOrEqual(1)
  })
})

// ─── Tabs ─────────────────────────────────────────────────────────────────────

describe('DriverNetworkTree — tabs', () => {
  it('renders a "Hierarquia" tab selected by default', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    const tab = screen.getByRole('tab', { name: /hierarquia/i })
    expect(tab).toBeInTheDocument()
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders an "Estatísticas" tab', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getByRole('tab', { name: /estatísticas/i })).toBeInTheDocument()
  })

  it('shows the hierarchy tree when "Hierarquia" tab is active', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('switches to stats view when "Estatísticas" tab is clicked', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    fireEvent.click(screen.getByRole('tab', { name: /estatísticas/i }))
    // Stats panel shows totalDrivers and maxDepth
    expect(screen.getByText('2')).toBeInTheDocument()   // totalDrivers
    expect(screen.getByText(/motoristas/i)).toBeInTheDocument()
  })

  it('hides the tree when "Estatísticas" tab is active', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    fireEvent.click(screen.getByRole('tab', { name: /estatísticas/i }))
    // Individual driver names are no longer shown in the stats panel
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  })

  it('returns to tree view when "Hierarquia" tab is clicked again', () => {
    render(<DriverNetworkTree hierarchy={hierarchyWithReferrals} />)
    fireEvent.click(screen.getByRole('tab', { name: /estatísticas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /hierarquia/i }))
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })
})
