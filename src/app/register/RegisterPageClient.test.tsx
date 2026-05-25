import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RegisterPageClient from './RegisterPageClient'
import type { OnboardingContext } from '../../types/network-v2'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockRegister = jest.fn()

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Seu nome'), 'Invalid Referral')
  await user.type(screen.getByPlaceholderText('seu@email.com'), 'invalid.referral@test.com')
  await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '21955554444')
  await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456')
}

const driverOnboarding: OnboardingContext = {
  flowType: 'DRIVER_TO_DRIVER',
  expectedActor: 'driver',
  invite: {
    code: 'john-d2d',
    displayLabel: 'Convite de Pedro Motta para a rede de motoristas ALIADO',
    inviter: { id: 'driver-pedro', actorType: 'driver', name: 'Pedro Motta', region: 'ZS' },
  },
  rootDriver: {
    id: 'driver-pedro',
    name: 'Pedro Motta',
    region: 'ZS',
    slug: 'pedro-motta-zs',
  },
}

const passengerOnboarding: OnboardingContext = {
  flowType: 'DRIVER_TO_PASSENGER',
  expectedActor: 'passenger',
  invite: {
    code: 'pedro-motta-zs',
    displayLabel: 'Pedro Motta convidou você para ser passageiro Aliado',
    inviter: { id: 'driver-pedro', actorType: 'driver', name: 'Pedro Motta', region: 'ZS' },
  },
  rootDriver: {
    id: 'driver-pedro',
    name: 'Pedro Motta',
    slug: 'pedro-motta-zs',
    region: 'ZS',
  },
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
    replace: jest.fn(),
    refresh: mockRefresh,
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

describe('RegisterPageClient', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockRegister.mockReset()
  })

  describe('role lock by expectedActor', () => {
    it('hides toggle and submits as passenger when expectedActor=passenger', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce(undefined)

      render(
        <RegisterPageClient referralSlug="pedro-motta-zs" onboarding={passengerOnboarding} />
      )

      expect(screen.getByText(/pedro motta convidou você/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^motorista$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^passageiro$/i })).not.toBeInTheDocument()

      await fillRegisterForm(user)
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Invalid Referral',
        email: 'invalid.referral@test.com',
        password: '123456',
        role: 'passenger',
        phone: '21955554444',
        referralCode: 'pedro-motta-zs',
      })
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/passenger'))
    })

    it('hides toggle and renders driver fields when expectedActor=driver', async () => {
      render(
        <RegisterPageClient referralSlug="john-d2d" onboarding={driverOnboarding} />
      )

      expect(
        screen.getByText(/convite de pedro motta para a rede de motoristas/i)
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^motorista$/i })).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText(/marca \(ex: toyota\)/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/placa \(ex: abc-1234\)/i)).toBeInTheDocument()
    })
  })

  describe('organic onboarding (no context)', () => {
    it('shows role toggle and no invite banner when onboarding is null and no slug', () => {
      render(<RegisterPageClient referralSlug="" onboarding={null} />)

      expect(screen.queryByTestId('invite-banner')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^passageiro$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^motorista$/i })).toBeInTheDocument()
    })

    it('forwards raw slug as referralCode fallback when ctx is null but slug present', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce(undefined)

      render(<RegisterPageClient referralSlug="unknown-slug" onboarding={null} />)

      // Generic banner since backend gave no displayLabel
      expect(screen.getByTestId('invite-banner')).toBeInTheDocument()
      expect(screen.getByText(/você chegou por um convite aliado/i)).toBeInTheDocument()
      // Toggle visible because no role lock
      expect(screen.getByRole('button', { name: /^motorista$/i })).toBeInTheDocument()

      await fillRegisterForm(user)
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'passenger', referralCode: 'unknown-slug' })
      )
    })
  })

  describe('invalid referral flow', () => {
    it('drops referralCode on retry and never touches localStorage', async () => {
      const user = userEvent.setup()
      mockRegister
        .mockRejectedValueOnce(new Error('Referral code inválido ou expirado'))
        .mockResolvedValueOnce(undefined)

      render(
        <RegisterPageClient referralSlug="pedro-motta-zs" onboarding={passengerOnboarding} />
      )

      await fillRegisterForm(user)
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      expect(
        await screen.findByText(/referral code inválido ou expirado/i)
      ).toBeInTheDocument()
      expect(mockRegister).toHaveBeenNthCalledWith(1, expect.objectContaining({
        referralCode: 'pedro-motta-zs',
      }))

      // Banner cleared, role lock released
      await waitFor(() => expect(screen.queryByTestId('invite-banner')).not.toBeInTheDocument())
      expect(screen.getByRole('button', { name: /^motorista$/i })).toBeInTheDocument()

      // No legacy localStorage keys should ever be touched by the client
      expect(localStorage.getItem('aliado:referralCode')).toBeNull()
      expect(localStorage.getItem('aliado:referredSlug')).toBeNull()
      expect(localStorage.getItem('aliado:referredDriver')).toBeNull()

      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(2))
      const secondCall = mockRegister.mock.calls[1][0]
      expect(secondCall.referralCode).toBeUndefined()
      expect(secondCall.role).toBe('passenger')

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/passenger'))
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
