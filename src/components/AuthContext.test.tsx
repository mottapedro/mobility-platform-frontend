import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { AUTH_INVALIDATED_EVENT, apiRequest } from '../services/api'

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

function RegisterConsumer() {
  const { user, register } = useAuth()
  return (
    <>
      <button onClick={() => register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'secret',
        role: 'passenger',
        phone: '11999999999',
      }).catch(() => { /* expected in contract test */ })}>
        registrar
      </button>
      {user && <span data-testid="registered">{user.name}</span>}
    </>
  )
}

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/passenger',
}))

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
    localStorage.setItem('aliado:token', 'stored-token')

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    expect(screen.getByTestId('name').textContent).toBe('Ana')
    expect(screen.getByTestId('role').textContent).toBe('passenger')
  })

  it('sets user after successful login', async () => {
    const apiResponse = {
      user: { id: '2', name: 'João', email: 'joao@test.com', role: 'driver' },
      driverId: 'driver-99',
      accessToken: 'jwt-access-login',
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
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('clears user and redirects on logout', async () => {
    const stored = { id: '1', name: 'Ana', email: 'ana@test.com', role: 'passenger' as const }
    localStorage.setItem('aliado:auth', JSON.stringify(stored))
    localStorage.setItem('aliado:token', 'stored-token')
    localStorage.setItem('passengerId', 'passenger-1')
    localStorage.setItem('driverId', 'driver-1')
    localStorage.setItem('passengerRideIds', JSON.stringify(['legacy-ride']))

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('sair')).toBeInTheDocument())

    await act(async () => {
      await userEvent.click(screen.getByText('sair'))
    })

    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(localStorage.getItem('passengerId')).toBeNull()
    expect(localStorage.getItem('driverId')).toBeNull()
    expect(localStorage.getItem('passengerRideIds')).toBeNull()
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

  it('rejects auth-only bootstrap and clears the partial session', async () => {
    localStorage.setItem('aliado:auth', JSON.stringify({ id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' }))

    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('rejects token-only bootstrap and clears the partial session', async () => {
    localStorage.setItem('aliado:token', 'orphan-token')

    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('invalidates the complete local session after an authenticated 401', async () => {
    localStorage.setItem('aliado:auth', JSON.stringify({ id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' }))
    localStorage.setItem('aliado:token', 'expired-token')
    localStorage.setItem('passengerId', 'passenger-1')
    localStorage.setItem('driverId', 'driver-1')
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ error: 'Passenger authentication required' })),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())

    await expect(apiRequest('/protected')).rejects.toMatchObject({ status: 401 })
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(localStorage.getItem('passengerId')).toBeNull()
    expect(localStorage.getItem('driverId')).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('supports relogin after session invalidation', async () => {
    localStorage.setItem('aliado:auth', JSON.stringify({ id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' }))
    localStorage.setItem('aliado:token', 'expired-token')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        user: { id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' },
        accessToken: 'fresh-token',
      })),
    } as unknown as Response)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    act(() => window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT)))
    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())

    await userEvent.click(screen.getByText('fazer login'))
    await waitFor(() => expect(localStorage.getItem('aliado:token')).toBe('fresh-token'))
  })

  it('does not authenticate register responses without a backend credential', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        user: { id: '2', name: 'Ana', email: 'ana@example.com', role: 'passenger' },
      })),
    } as unknown as Response)

    render(<AuthProvider><RegisterConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('registrar'))
    await waitFor(() => expect(localStorage.getItem('aliado:auth')).toBeNull())
    expect(screen.queryByTestId('registered')).not.toBeInTheDocument()
  })

  it('synchronizes logout from another tab', async () => {
    localStorage.setItem('aliado:auth', JSON.stringify({ id: '1', name: 'Ana', email: 'a@b.com', role: 'passenger' }))
    localStorage.setItem('aliado:token', 'stored-token')

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('name')).toBeInTheDocument())
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'aliado:token', oldValue: 'stored-token', newValue: null })))

    await waitFor(() => expect(screen.getByText('fazer login')).toBeInTheDocument())
    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })
})
