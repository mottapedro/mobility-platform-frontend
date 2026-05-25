import { render, screen } from '@testing-library/react'
import { DriverBottomNav } from './DriverBottomNav'

const mockPathname = jest.fn(() => '/driver/offers')
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('DriverBottomNav', () => {
  it('renders all navigation tabs', () => {
    render(<DriverBottomNav />)
    expect(screen.getByText('Ofertas')).toBeInTheDocument()
    expect(screen.getByText('Corridas')).toBeInTheDocument()
    expect(screen.getByText('Ganhos')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('marks the Ofertas tab as active on /driver/offers', () => {
    mockPathname.mockReturnValue('/driver/offers')
    render(<DriverBottomNav />)
    const ofertas = screen.getByText('Ofertas').closest('a')
    expect(ofertas?.className).toContain('text-[#F28C28]')
  })

  it('marks Corridas as active on /driver/rides', () => {
    mockPathname.mockReturnValue('/driver/rides')
    render(<DriverBottomNav />)
    const corridas = screen.getByText('Corridas').closest('a')
    expect(corridas?.className).toContain('text-[#F28C28]')
  })

  it('does not apply active style to non-active tabs', () => {
    mockPathname.mockReturnValue('/driver/offers')
    render(<DriverBottomNav />)
    const ganhos = screen.getByText('Ganhos').closest('a')
    expect(ganhos?.className).not.toContain('text-[#F28C28]')
  })
})
