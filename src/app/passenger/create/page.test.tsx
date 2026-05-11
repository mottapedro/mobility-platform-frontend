import { render, screen } from '@testing-library/react'

import PassengerCreatePage from './page'

const mockPush = jest.fn()
const mockUsePassenger = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('../../../hooks/usePassenger', () => ({
  usePassenger: (...args: unknown[]) => mockUsePassenger(...args),
}))

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { passengerId: 'passenger-1' },
  }),
}))

jest.mock('../../../components/AuthGuard', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../components/AppHeader', () => ({
  AppHeader: () => <div>header</div>,
}))

describe('PassengerCreatePage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockUsePassenger.mockReset()
  })

  it('keeps showing the stored referral driver without an error banner when backend loading fails', () => {
    localStorage.setItem('aliado:referredDriver', JSON.stringify({
      id: 'driver-1',
      name: 'Pedro Motta',
      phone: '21900000001',
    }))

    mockUsePassenger.mockReturnValue({
      data: null,
      loading: false,
      error: 'Erro ao carregar',
    })

    render(<PassengerCreatePage />)

    expect(screen.getByText('Motorista aliado indicado')).toBeInTheDocument()
    expect(screen.getByText('Pedro Motta')).toBeInTheDocument()
    expect(screen.getByText('21900000001')).toBeInTheDocument()
    expect(screen.queryByText('Erro ao carregar motorista')).not.toBeInTheDocument()
  })

  it('shows the error banner when there is no stored referral driver', () => {
    mockUsePassenger.mockReturnValue({
      data: null,
      loading: false,
      error: 'Erro ao carregar',
    })

    render(<PassengerCreatePage />)

    expect(screen.getByText('Erro ao carregar motorista')).toBeInTheDocument()
  })
})