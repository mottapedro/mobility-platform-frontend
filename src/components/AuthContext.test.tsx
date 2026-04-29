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
      json: () => Promise.resolve(apiResponse),
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
      json: () => Promise.resolve({ error: 'Credenciais inválidas' }),
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
})
