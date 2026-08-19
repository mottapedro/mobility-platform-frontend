import { render, screen, waitFor, within } from '@testing-library/react'
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

async function fillDriverVehicle(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/marca \(ex: toyota\)/i), 'Toyota')
  await user.type(screen.getByPlaceholderText(/modelo \(ex: corolla\)/i), 'Corolla')
  await user.type(screen.getByPlaceholderText(/placa \(ex: abc-1234\)/i), 'ABC1234')
}

async function fillDriverBase(user: ReturnType<typeof userEvent.setup>, text = 'Av. Rio') {
  mockSearchAddresses.mockResolvedValue(BASE_SUGGESTIONS)
  const baseInput = screen.getByPlaceholderText(
    /endereço\/base de onde você normalmente/i
  )
  await user.type(baseInput, text)
  const listbox = await screen.findByRole('listbox')
  const suggestion = await within(listbox).findByText(/Av\. Rio Branco/i)
  await user.click(suggestion)
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

jest.mock('../../services/geocode', () => ({
  searchAddresses: jest.fn(),
  getPlaceDetails: jest.fn(),
  geocodeAddress: jest.fn(),
}))

import * as geocode from '../../services/geocode'

const mockSearchAddresses = geocode.searchAddresses as jest.MockedFunction<
  typeof geocode.searchAddresses
>

const BASE_SUGGESTIONS = [
  {
    displayName: 'Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ',
    placeId: 'place-rio-001',
    lat: -22.9055,
    lng: -43.1791,
  },
]

describe('RegisterPageClient', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockRegister.mockReset()
    mockSearchAddresses.mockReset()
    mockSearchAddresses.mockResolvedValue([])
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

  describe('operational base (M→A origin)', () => {
    it('does not render the base field for passenger role', () => {
      render(
        <RegisterPageClient referralSlug="" onboarding={passengerOnboarding} />
      )

      expect(
        screen.queryByPlaceholderText(/endereço\/base de onde você normalmente/i)
      ).not.toBeInTheDocument()
    })

    it('blocks driver submit without a selected operational base', async () => {
      const user = userEvent.setup()

      render(
        <RegisterPageClient referralSlug="" onboarding={driverOnboarding} />
      )

      await fillRegisterForm(user)
      await fillDriverVehicle(user)
      await user.click(screen.getByText('Zona Norte'))
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      expect(
        await screen.findByText(/selecione um endereço válido da lista de sugestões/i)
      ).toBeInTheDocument()
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('blocks driver submit when typed text has no valid provider selection', async () => {
      const user = userEvent.setup()

      render(
        <RegisterPageClient referralSlug="" onboarding={driverOnboarding} />
      )

      await fillRegisterForm(user)
      await fillDriverVehicle(user)
      await user.click(screen.getByText('Zona Norte'))

      // Type in the base field but never pick a Google suggestion
      await user.type(
        screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i),
        'Av. Rio sem selecionar'
      )
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      expect(
        await screen.findByText(/selecione um endereço válido da lista de sugestões/i)
      ).toBeInTheDocument()
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('submits operationalBase (formattedAddress + providerPlaceId) without lat/lng', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce(undefined)

      render(
        <RegisterPageClient referralSlug="" onboarding={driverOnboarding} />
      )

      await fillRegisterForm(user)
      await fillDriverVehicle(user)
      await user.click(screen.getByText('Zona Norte'))
      await fillDriverBase(user)

      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
      const payload = mockRegister.mock.calls[0][0]
      expect(payload.operationalBase).toEqual({
        formattedAddress: 'Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ',
        providerPlaceId: 'place-rio-001',
      })
      expect(payload.operationalBase).not.toHaveProperty('lat')
      expect(payload.operationalBase).not.toHaveProperty('lng')
      expect(payload).not.toHaveProperty('latitude')
      expect(payload).not.toHaveProperty('longitude')
      expect(payload.role).toBe('driver')
      expect(payload.region).toEqual(['ZN'])
    })

    it('shows backend refusal without persisting an invalid selection', async () => {
      const user = userEvent.setup()
      mockRegister.mockRejectedValueOnce(new Error('Endereço da base não reconhecido'))

      render(
        <RegisterPageClient referralSlug="" onboarding={driverOnboarding} />
      )

      await fillRegisterForm(user)
      await fillDriverVehicle(user)
      await user.click(screen.getByText('Zona Norte'))
      await fillDriverBase(user)

      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      expect(
        await screen.findByText(/endereço da base não reconhecido/i)
      ).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
