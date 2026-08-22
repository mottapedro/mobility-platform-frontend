/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import DriverGanhosPage from './page'
import { useEconomicDomain } from '../../../contexts/domains/EconomicDomainProvider'

jest.mock('../../../contexts/domains/EconomicDomainProvider')

const mockUseEconomicDomain = useEconomicDomain as jest.MockedFunction<typeof useEconomicDomain>

const activation = {
  enabled: true,
  isReady: true,
  isHydrated: true,
  hasIdentity: true,
}

describe('DriverGanhosPage', () => {
  beforeEach(() => {
    mockUseEconomicDomain.mockReturnValue({
      activation,
      loading: false,
      error: null,
      snapshot: {
        passengers: 5,
        rides: 5,
        revenue: 220.65,
      },
      refresh: jest.fn().mockResolvedValue(undefined),
    })
  })

  it('renders Pedro earnings as settled BRL with cents and an explicit period', () => {
    render(<DriverGanhosPage />)

    expect(screen.getByText('Seus ganhos liquidados')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?220,65/)).toBeInTheDocument()
    expect(screen.getAllByText('Últimos 30 dias')).toHaveLength(2)
    expect(screen.getByText('Corridas liquidadas')).toBeInTheDocument()
  })

  it('keeps João at zero earnings without changing passenger or ride counts', () => {
    mockUseEconomicDomain.mockReturnValue({
      activation,
      loading: false,
      error: null,
      snapshot: {
        passengers: 10,
        rides: 0,
        revenue: 0,
      },
      refresh: jest.fn().mockResolvedValue(undefined),
    })

    render(<DriverGanhosPage />)

    expect(screen.getByText('Seus ganhos liquidados')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?0,00/)).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
