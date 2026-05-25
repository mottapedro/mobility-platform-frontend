import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RegisterPageClient from './RegisterPageClient'

const mockPush = jest.fn()
const mockRegister = jest.fn()

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Seu nome'), 'Invalid Referral')
  await user.type(screen.getByPlaceholderText('seu@email.com'), 'invalid.referral@test.com')
  await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '21955554444')
  await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456')
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}))

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: mockRegister,
  }),
}))

describe('RegisterPageClient invalid referral flow', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockRegister.mockReset()
  })

  it('clears invalid referral and retries without referralCode', async () => {
    const user = userEvent.setup()

    localStorage.setItem('aliado:referralCode', 'pedro-motta-zs')
    localStorage.setItem('aliado:referredSlug', 'pedro-motta-zs')
    localStorage.setItem(
      'aliado:referredDriver',
      JSON.stringify({ id: 'driver-1', name: 'Pedro Motta', phone: '21900000001' })
    )

    mockRegister
      .mockRejectedValueOnce(new Error('Referral code inválido ou expirado'))
      .mockRejectedValueOnce(new Error('Erro ao cadastrar'))

    render(<RegisterPageClient referralSlug="pedro-motta-zs" />)

    expect(await screen.findByText(/convite ativo/i)).toBeInTheDocument()
    expect(await screen.findByText(/você foi convidado por pedro motta/i)).toBeInTheDocument()

    await fillRegisterForm(user)
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText(/referral code inválido ou expirado/i)).toBeInTheDocument()

    expect(mockRegister).toHaveBeenNthCalledWith(1, {
      name: 'Invalid Referral',
      email: 'invalid.referral@test.com',
      password: '123456',
      role: 'passenger',
      phone: '21955554444',
      referralCode: 'pedro-motta-zs',
    })

    expect(localStorage.getItem('aliado:referralCode')).toBeNull()
    expect(localStorage.getItem('aliado:referredSlug')).toBeNull()
    expect(localStorage.getItem('aliado:referredDriver')).toBeNull()

    await waitFor(() => {
      expect(screen.queryByText(/convite ativo/i)).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/você foi convidado por/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(2)
    })

    expect(mockRegister).toHaveBeenNthCalledWith(2, {
      name: 'Invalid Referral',
      email: 'invalid.referral@test.com',
      password: '123456',
      role: 'passenger',
      phone: '21955554444',
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects on successful retry after invalid referral cleanup', async () => {
    const user = userEvent.setup()

    localStorage.setItem('aliado:referralCode', 'pedro-motta-zs')
    localStorage.setItem('aliado:referredSlug', 'pedro-motta-zs')

    mockRegister
      .mockRejectedValueOnce(new Error('Referral code inválido ou expirado'))
      .mockResolvedValueOnce(undefined)

    render(<RegisterPageClient referralSlug="pedro-motta-zs" />)

    await fillRegisterForm(user)
    await user.click(screen.getByRole('button', { name: /criar conta/i }))
    expect(await screen.findByText(/referral code inválido ou expirado/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/passenger')
    })
  })
})
