import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

// Minimal consumer component to access context values
function TestConsumer() {
  const { user, login, logout, loading } = useAuth()
  if (loading) return <span>carregando...</span>
  if (!user) {
    return (
      <button
        onClick={() => login('a@b.com', 'secret').catch(() => { /* ignore */ })}
      >
        fazer login
      </button>
    )
  }
  return (
    <div>
      <span data-testid="name">{user.name}</span>
      <span data-testid="role">{user.role}</span>
      <button onClick={logout}>sair</button>
    </div>
  )
}

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }))

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    mockReplace.mockClear()
    jest.restoreAllMocks()
  })

  it('starts with no user when localStorage is empty', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.queryByText('carregando...')).not.toBeInTheDocument())
    expect(screen.getByText('fazer login')).toBeInTheDocument()
  })

  it('restores user from localStorage on mount', async () => {
    const stored = { id: '1', name: 'Ana', email: 'ana@test.com', role: 'passenger' as const }
    localStorage.setItem('aliado:auth', JSON.stringify(stored))

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    expect(screen.getByTestId('name').textContent).toBe('Ana')
    expect(screen.getByTestId('role').textContent).toBe('passenger')
  })

  it('sets user after successful login', async () => {
    const apiResponse = {
      user: { id: '2', name: 'João', email: 'joao@test.com', role: 'driver' },
      driverId: 'driver-99',
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(apiResponse)),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('fazer login'))
    })

    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    expect(screen.getByTestId('name').textContent).toBe('João')
  })

  it('throws when login API returns non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(JSON.stringify({ error: 'Credenciais inválidas' })),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())

    // Click triggers login which should throw — user should stay null
    await act(async () => {
      await userEvent.click(screen.getByText('fazer login'))
    })

    // User should remain null — login button still shown
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())
  })

  it('clears user and redirects on logout', async () => {
    const stored = { id: '1', name: 'Ana', email: 'ana@test.com', role: 'passenger' as const }
    localStorage.setItem('aliado:auth', JSON.stringify(stored))

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('sair')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('sair'))
    })

    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('stores JWT token in localStorage after successful login', async () => {
    const apiResponse = {
      token: 'jwt-driver-token-xyz',
      user: { id: '3', name: 'Pedro', email: 'pedro@test.com', role: 'driver' },
      driverId: 'driver-42',
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(apiResponse)),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('fazer login'))
    })

    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:token')).toBe('jwt-driver-token-xyz')
  })

  it('stores accessToken (Bearer) from the backend when token is absent', async () => {
    const apiResponse = {
      accessToken: 'jwt-access-abc',
      user: { id: '4', name: 'Ana', email: 'ana@test.com', role: 'driver' },
      driverId: 'driver-88',
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(apiResponse)),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('fazer login'))
    })

    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:token')).toBe('jwt-access-abc')
  })

  it('removes JWT token from localStorage on logout', async () => {
    localStorage.setItem('aliado:auth', JSON.stringify({ id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' as const }))
    localStorage.setItem('aliado:token', 'old-token')

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('sair')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('sair'))
    })

    expect(localStorage.getItem('aliado:token')).toBeNull()
  })
})
