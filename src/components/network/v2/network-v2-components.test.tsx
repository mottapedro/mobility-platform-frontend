/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { NetworkMetricsBar } from './NetworkMetricsBar'
import { RootDriverCard } from './RootDriverCard'
import { GenealogySocial } from './GenealogySocial'
import { OperationalOwnership } from './OperationalOwnership'
import { LateralNetwork } from './LateralNetwork'
import { NetworkExperience } from './NetworkExperience'
import { ProjectionTree } from './ProjectionTree'
import {
  networkContextFixtures,
  onboardingContextFixtures,
} from '@/services/__mocks__/network.fixtures'
import type { GenealogyProjection } from '@/types/network-v2'

describe('V2 components (network/v2)', () => {
  // ─── NetworkMetricsBar ────────────────────────────────────────────────

  describe('NetworkMetricsBar', () => {
    it('renders core metrics + growth subline', () => {
      render(
        <NetworkMetricsBar
          metrics={networkContextFixtures.DRIVER_TO_DRIVER.networkMetrics}
        />,
      )
      const bar = screen.getByTestId('network-metrics-bar')
      expect(within(bar).getByText('Rede total')).toBeInTheDocument()
      expect(within(bar).getByText('4')).toBeInTheDocument()
      expect(within(bar).getByText('3 ativos')).toBeInTheDocument()
      expect(within(bar).getByText(/\+1 \(7d\) · \+4 \(30d\)/)).toBeInTheDocument()
    })

    it('formats estimatedRevenue when present', () => {
      render(
        <NetworkMetricsBar
          metrics={networkContextFixtures.DRIVER_TO_DRIVER.networkMetrics}
        />,
      )
      expect(screen.getByText(/R\$\s?2\.541/)).toBeInTheDocument()
    })

    it('hides revenue card when metric absent', () => {
      render(
        <NetworkMetricsBar
          metrics={networkContextFixtures.DRIVER_TO_PASSENGER.networkMetrics}
        />,
      )
      expect(screen.queryByText('Receita estimada')).not.toBeInTheDocument()
    })
  })

  // ─── RootDriverCard ───────────────────────────────────────────────────

  describe('RootDriverCard', () => {
    it('renders root driver fields and assisted-transport badge', () => {
      render(
        <RootDriverCard
          rootDriver={
            onboardingContextFixtures.DRIVER_TO_PASSENGER.rootDriver!
          }
        />,
      )
      const card = screen.getByTestId('root-driver-card')
      expect(within(card).getByText('Pedro Motta')).toBeInTheDocument()
      expect(
        within(card).getByText('Toyota Corolla • PED0001'),
      ).toBeInTheDocument()
      expect(within(card).getByText('Acessível')).toBeInTheDocument()
      expect(within(card).getByText('★ 4.9')).toBeInTheDocument()
    })

    it('renders the provided CTA', () => {
      render(
        <RootDriverCard
          rootDriver={
            onboardingContextFixtures.DRIVER_TO_PASSENGER.rootDriver!
          }
          cta={<button type="button">Pedir corrida</button>}
        />,
      )
      expect(
        screen.getByRole('button', { name: 'Pedir corrida' }),
      ).toBeInTheDocument()
    })
  })

  // ─── GenealogySocial ──────────────────────────────────────────────────

  describe('GenealogySocial', () => {
    it('renders ancestors, me, and recursive descendants (D2D)', () => {
      render(
        <GenealogySocial
          genealogy={networkContextFixtures.DRIVER_TO_DRIVER.genealogy}
        />,
      )
      expect(screen.getByText('Pedro Motta')).toBeInTheDocument() // ancestor
      expect(screen.getByText('João Silva')).toBeInTheDocument() // me
      expect(screen.getByText('Maria Souza')).toBeInTheDocument() // depth 1
      expect(screen.getByText('Ana Lima')).toBeInTheDocument() // depth 2
      expect(screen.getByText('Nível 1')).toBeInTheDocument()
      expect(screen.getByText('Nível 2')).toBeInTheDocument()
      expect(screen.getByText('você')).toBeInTheDocument()
    })

    it('keeps descendant labels relative even when absoluteDepth is present', () => {
      const genealogy = {
        ...networkContextFixtures.DRIVER_TO_DRIVER.genealogy,
        descendants: [
          {
            actor: networkContextFixtures.DRIVER_TO_DRIVER.genealogy.descendants[0].actor,
            depth: 1,
            absoluteDepth: 2,
            children: [
              {
                actor: networkContextFixtures.DRIVER_TO_DRIVER.genealogy.descendants[0].children[0].actor,
                depth: 2,
                absoluteDepth: 3,
                children: [],
              },
            ],
          },
        ],
      }

      render(<GenealogySocial genealogy={genealogy} />)

      expect(screen.getByText('Nível 1')).toBeInTheDocument()
      expect(screen.getByText('Nível 2')).toBeInTheDocument()
    })

    it('shows empty-state when descendants are empty', () => {
      render(
        <GenealogySocial
          genealogy={networkContextFixtures.DRIVER_TO_PASSENGER.genealogy}
        />,
      )
      expect(screen.getByText('Sua rede começa agora')).toBeInTheDocument()
    })
  })

  // ─── OperationalOwnership ─────────────────────────────────────────────

  describe('OperationalOwnership', () => {
    it('renders the operational owner driver', () => {
      render(
        <OperationalOwnership
          operationalOwner={
            networkContextFixtures.DRIVER_TO_PASSENGER.genealogy.operationalOwner
          }
        />,
      )
      expect(screen.getByText('Motorista responsável')).toBeInTheDocument()
      expect(screen.getByTestId('root-driver-card')).toBeInTheDocument()
      expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
    })

    it('shows empty-state when operationalOwner is null', () => {
      render(<OperationalOwnership operationalOwner={null} />)
      expect(screen.getByText('Sem motorista operacional')).toBeInTheDocument()
    })
  })

  // ─── LateralNetwork ───────────────────────────────────────────────────

  describe('LateralNetwork', () => {
    it('renders all lateral actors', () => {
      render(
        <LateralNetwork
          lateral={
            networkContextFixtures.DRIVER_TO_PASSENGER.genealogy.lateral
          }
        />,
      )
      const items = screen.getAllByTestId('lateral-actor')
      expect(items).toHaveLength(2)
      expect(screen.getByText('Lucas Pinto')).toBeInTheDocument()
      expect(screen.getByText('Renata Vaz')).toBeInTheDocument()
    })

    it('shows empty-state when lateral is empty', () => {
      render(<LateralNetwork lateral={[]} />)
      expect(screen.getByText('Seu núcleo lateral ainda não abriu')).toBeInTheDocument()
    })
  })

  // ─── NetworkExperience ────────────────────────────────────────────────

  describe('NetworkExperience', () => {
    it('renders metrics, social tab default, and exposes flowType', () => {
      render(
        <NetworkExperience
          context={networkContextFixtures.DRIVER_TO_DRIVER}
        />,
      )
      const root = screen.getByTestId('network-experience')
      expect(root).toHaveAttribute('data-flow-type', 'DRIVER_TO_DRIVER')
      expect(screen.getByTestId('network-metrics-bar')).toBeInTheDocument()
      expect(screen.getByTestId('genealogy-social')).toBeInTheDocument()
    })

    it('does not show RootDriverCard for driver flows', () => {
      render(
        <NetworkExperience
          context={networkContextFixtures.DRIVER_TO_DRIVER}
        />,
      )
      expect(screen.queryByTestId('root-driver-card')).not.toBeInTheDocument()
    })

    it('shows RootDriverCard + operational tab for passenger flows', () => {
      render(
        <NetworkExperience
          context={networkContextFixtures.DRIVER_TO_PASSENGER}
        />,
      )
      expect(screen.getByTestId('root-driver-card')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Operacional' }))
      expect(screen.getByTestId('operational-ownership')).toBeInTheDocument()
    })

    it('switches to lateral tab on click', () => {
      render(
        <NetworkExperience
          context={networkContextFixtures.DRIVER_TO_DRIVER}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Lateral' }))
      expect(screen.getByTestId('lateral-network')).toBeInTheDocument()
      expect(screen.queryByTestId('genealogy-social')).not.toBeInTheDocument()
    })
  })

  // ─── ProjectionTree ────────────────────────────────────────────────────

  const projectionFixture: GenealogyProjection = {
    rootDriver: {
      id: 'drv-root',
      name: 'Pedro Motta',
      experienceLevel: null,
      networkLevel: 1,
      publicSlug: 'pedro-motta',
      referralCode: 'PEDRO',
    },
    stats: { totalNodes: 3, totalEdges: 2, maxDepth: 2, appliedDepthLimit: 5 },
    nodes: [
      {
        actorId: 'drv-root',
        actorType: 'DRIVER',
        name: 'Pedro Motta',
        flowType: 'DRIVER_TO_DRIVER',
        level: 0,
        absoluteDepth: 0,
        rootDriverId: 'drv-root',
        parentId: null,
        publicSlug: 'pedro-motta',
        referralCode: 'PEDRO',
        networkLevel: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        actorId: 'drv-a',
        actorType: 'DRIVER',
        name: 'Alice Ferreira',
        flowType: 'DRIVER_TO_DRIVER',
        level: 1,
        absoluteDepth: 1,
        rootDriverId: 'drv-root',
        parentId: 'drv-root',
        publicSlug: null,
        referralCode: null,
        networkLevel: 2,
        createdAt: '2024-02-01T00:00:00.000Z',
      },
      {
        actorId: 'psg-b',
        actorType: 'PASSENGER',
        name: 'Bob Alves',
        flowType: 'DRIVER_TO_PASSENGER',
        level: 1,
        absoluteDepth: 1,
        rootDriverId: 'drv-root',
        parentId: 'drv-root',
        publicSlug: null,
        referralCode: null,
        networkLevel: 1,
        createdAt: '2024-03-01T00:00:00.000Z',
      },
    ],
    edges: [
      { sourceActorId: 'drv-root', targetActorId: 'drv-a', flowType: 'DRIVER_TO_DRIVER' },
      { sourceActorId: 'drv-root', targetActorId: 'psg-b', flowType: 'DRIVER_TO_PASSENGER' },
    ],
    levels: [
      { depth: 0, nodeIds: ['drv-root'] },
      { depth: 1, nodeIds: ['drv-a', 'psg-b'] },
    ],
    metrics: {
      totalDrivers: 2,
      totalPassengers: 1,
      totalRelationships: 2,
      totalD2D: 1,
      totalD2P: 1,
      totalP2P: 0,
      maxDepth: 1,
    },
  }

  describe('ProjectionTree', () => {
    it('renders tree nodes for each BFS depth', () => {
      render(<ProjectionTree projection={projectionFixture} />)
      expect(screen.getAllByTestId('tree-node-depth-0')).toHaveLength(1)
      expect(screen.getAllByTestId('tree-node-depth-1')).toHaveLength(2)
    })

    it('renders a row for each node with its display name', () => {
      render(<ProjectionTree projection={projectionFixture} />)
      expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
      expect(screen.getByText('Alice Ferreira')).toBeInTheDocument()
      expect(screen.getByText('Bob Alves')).toBeInTheDocument()
    })

    it('renders the metrics strip with totals', () => {
      render(<ProjectionTree projection={projectionFixture} />)
      const metricsDiv = screen.getByTestId('projection-metrics')
      // metrics.totalDrivers + metrics.totalPassengers = 3
      expect(within(metricsDiv).getByText('3')).toBeInTheDocument()
      // metrics.totalDrivers = 2
      expect(within(metricsDiv).getByText('2')).toBeInTheDocument()
      // metrics.totalPassengers = 1 appears twice (also maxDepth=1)
      expect(within(metricsDiv).getAllByText('1').length).toBeGreaterThanOrEqual(1)
    })

    it('shows EmptyState when nodes array is empty', () => {
      const emptyProjection: GenealogyProjection = {
        ...projectionFixture,
        nodes: [],
        levels: [],
      }
      render(<ProjectionTree projection={emptyProjection} />)
      expect(screen.getByText('Rede ainda sem membros')).toBeInTheDocument()
    })
  })
})
