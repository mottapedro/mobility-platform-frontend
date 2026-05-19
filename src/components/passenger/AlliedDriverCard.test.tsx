import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlliedDriverCard } from './AlliedDriverCard'
import type { AlliedDriverCardData } from '../../hooks/useAlliedDriver'

const mockDriver: AlliedDriverCardData = {
  avatarLabel: 'JM',
  name: 'João Motorista',
  phoneLabel: '(11) 99999-0001',
  regionLabel: 'Zona Sul',
  vehicleLabel: 'Toyota Corolla',
  ratingLabel: '4.9',
  headline: 'Motorista parceiro há 2 anos',
  rawPhone: '5511999990001',
}

describe('AlliedDriverCard', () => {
  it('shows loading skeleton when loading and no driver', () => {
    const { container } = render(
      <AlliedDriverCard driver={null} loading={true} error={false} onRequestRide={() => {}} />,
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state when error is true', () => {
    render(
      <AlliedDriverCard driver={null} loading={false} error={true} onRequestRide={() => {}} />,
    )
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument()
  })

  it('renders driver name when driver is provided', () => {
    render(
      <AlliedDriverCard driver={mockDriver} loading={false} error={false} onRequestRide={() => {}} />,
    )
    expect(screen.getByText('João Motorista')).toBeInTheDocument()
  })

  it('renders driver avatar label', () => {
    render(
      <AlliedDriverCard driver={mockDriver} loading={false} error={false} onRequestRide={() => {}} />,
    )
    const avatars = screen.getAllByText('JM')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('calls onRequestRide when the action button is clicked', async () => {
    const user = userEvent.setup()
    const mockFn = jest.fn()
    render(
      <AlliedDriverCard driver={mockDriver} loading={false} error={false} onRequestRide={mockFn} />,
    )
    const btn = screen.getByRole('button', { name: /solicitar/i })
    await user.click(btn)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no driver and not loading and no error', () => {
    render(
      <AlliedDriverCard driver={null} loading={false} error={false} onRequestRide={() => {}} />,
    )
    expect(screen.getByText(/nenhum motorista aliado/i)).toBeInTheDocument()
  })
})
