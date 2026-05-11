import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RegisterPageClient from './RegisterPageClient'

const mockPush = jest.fn()
const mockRegister = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

describe('RegisterPageClient invalid referral flow', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockRegister.mockReset()
  })

  it('shows the invalid referral error, clears stored referral data, and retries without referralCode', async () => {
    const user = userEvent.setup()

    localStorage.setItem('aliado:referralCode', 'pedro-motta-zs')
    localStorage.setItem('aliado:referredSlug', 'pedro-motta-zs')
    localStorage.setItem('aliado:referredDriver', JSON.stringify({
      id: 'driver-1',
      name: 'Pedro Motta',
      phone: '21900000001',
    }))

    mockRegister
      .mockRejectedValueOnce(new Error('Referral code inválido ou expirado'))
      .mockRejectedValueOnce(new Error('Erro ao cadastrar'))

    render(<RegisterPageClient referralSlug="pedro-motta-zs" />)

    await user.type(screen.getByPlaceholderText('Seu nome'), 'Invalid Referral')
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'invalid.referral@test.com')
    await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '21955554444')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456')

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(screen.getByText('Referral code inválido ou expirado')).toBeInTheDocument()
    })

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

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

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
})