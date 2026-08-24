import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from './AuthGuard'
import { useAuth } from '../contexts/AuthContext'

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/passenger',
}))

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('ProtectedRoute session contract', () => {
  beforeEach(() => {
    localStorage.clear()
    mockReplace.mockClear()
  })

  it('does not trust a user without an access token', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'passenger' },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    })

    render(<ProtectedRoute><span>conteudo protegido</span></ProtectedRoute>)

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument()
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'))
  })

  it('renders protected content only with a user and token', async () => {
    localStorage.setItem('aliado:token', 'valid-token')
    mockedUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'passenger' },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    })

    render(<ProtectedRoute><span>conteudo protegido</span></ProtectedRoute>)

    expect(screen.getByText('conteudo protegido')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
