import { render, screen } from '@testing-library/react'
import { PassengerBottomNav } from './PassengerBottomNav'

const mockPathname = jest.fn(() => '/passenger')
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  mockPathname.mockReturnValue('/passenger')
})

describe('PassengerBottomNav', () => {
  it('renders all navigation tabs', () => {
    render(<PassengerBottomNav />)
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Viagens')).toBeInTheDocument()
    expect(screen.getByText('Motorista')).toBeInTheDocument()
    expect(screen.getByText('Rede')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('marks the active tab based on current pathname', () => {
    mockPathname.mockReturnValue('/passenger/rides')
    render(<PassengerBottomNav />)
    const viagens = screen.getByText('Viagens').closest('button')
    expect(viagens?.className).toContain('text-[#F28C28]')
  })

  it('marks Início as active on /passenger', () => {
    mockPathname.mockReturnValue('/passenger')
    render(<PassengerBottomNav />)
    const inicio = screen.getByText('Início').closest('button')
    expect(inicio?.className).toContain('text-[#F28C28]')
  })

  it('marks Motorista tab as active on /passenger/driver', () => {
    mockPathname.mockReturnValue('/passenger/driver')
    render(<PassengerBottomNav />)
    const motorista = screen.getByText('Motorista').closest('button')
    expect(motorista?.className).toContain('text-[#F28C28]')
  })
})
