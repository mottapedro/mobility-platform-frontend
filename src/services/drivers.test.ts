import {
  buildDriverSlug,
  findDriverByReferralSlug,
  formatDriverPhone,
  getDriverMe,
  getDriverOffers,
  getDriverOperationalBase,
  getDriverRides,
  getRegionLabelFromSlug,
  toDriverReferralProfile,
  updateDriverOperationalBase,
  type DriverSummary,
} from './drivers'

jest.mock('./api', () => ({
  apiRequest: jest.fn(),
}))

import { apiRequest } from './api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('drivers referral helpers', () => {
  const drivers: DriverSummary[] = [
    { id: '1', name: 'Carlos Ávila', phone: '21900000001' },
    { id: '2', name: 'Pedro Motta', phone: '21900000002' },
  ]

  it('builds stable slugs without accents', () => {
    expect(buildDriverSlug('Carlos Ávila')).toBe('carlos-avila')
  })

  it('matches drivers by exact slug or region suffix', () => {
    expect(findDriverByReferralSlug(drivers, 'pedro-motta')?.id).toBe('2')
    expect(findDriverByReferralSlug(drivers, 'carlos-avila-zs')?.id).toBe('1')
  })

  it('formats referral fallback metadata', () => {
    const profile = toDriverReferralProfile(drivers[0], 'carlos-avila-zs')

    expect(profile.avatarLabel).toBe('CA')
    expect(profile.regionLabel).toBe('Zona Sul')
    expect(profile.vehicleLabel).toBe('Veículo parceiro Aliado')
    expect(profile.ratingLabel).toBe('Em breve')
  })

  it('formats phone numbers and unknown regions safely', () => {
    expect(formatDriverPhone('21900000001')).toBe('(21) 90000-0001')
    expect(getRegionLabelFromSlug('pedro-motta')).toBe('Atendimento sob consulta')
  })
})

describe('driver scoped service guards', () => {
  beforeEach(() => {
    mockApiRequest.mockReset()
  })

  it('throws when getDriverOffers receives invalid driverId', async () => {
    await expect(getDriverOffers('undefined')).rejects.toThrow('driverId ausente')
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('throws when getDriverRides receives invalid driverId', async () => {
    await expect(getDriverRides('   ')).rejects.toThrow('driverId ausente')
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('uses sanitized id in getDriverOffers endpoint', async () => {
    mockApiRequest.mockResolvedValue([])

    await getDriverOffers(' drv_1 ')

    expect(mockApiRequest).toHaveBeenCalledWith('/drivers/drv_1/offers')
  })

  it('calls GET /drivers/me without a driverId param (Bearer profile)', async () => {
    mockApiRequest.mockResolvedValue({
      driverId: 'drv_me',
      name: 'João',
      email: 'joao@test.com',
      phone: '21999999999',
      referralCode: 'joao-me',
      publicSlug: 'joao-me-zs',
      networkLevel: 1,
      experienceLevel: 'PROFISSIONAL',
      regions: ['ZS'],
    })

    const profile = await getDriverMe()

    expect(mockApiRequest).toHaveBeenCalledWith('/drivers/me')
    expect(profile.driverId).toBe('drv_me')
  })
})

describe('operational base self-service (Bearer-only)', () => {
  beforeEach(() => {
    mockApiRequest.mockReset()
  })

  const BASE = {
    id: 'base_1',
    driverId: 'drv_1',
    formattedAddress: 'Av. Paulista, 1000, São Paulo, SP',
    providerPlaceId: 'ChIJ_paulista',
    latitude: -23.5614,
    longitude: -46.6558,
    updatedAt: '2026-08-18T00:00:00.000Z',
  }

  it('GET /drivers/me/operational-base via apiRequest (Bearer, sem driverId)', async () => {
    mockApiRequest.mockResolvedValue({ operationalBase: BASE })

    const result = await getDriverOperationalBase()

    expect(mockApiRequest).toHaveBeenCalledWith('/drivers/me/operational-base')
    expect(result?.formattedAddress).toBe(BASE.formattedAddress)
  })

  it('GET retorna null quando a base não está configurada (estado NO_BASE)', async () => {
    mockApiRequest.mockResolvedValue({ operationalBase: null })

    const result = await getDriverOperationalBase()

    expect(result).toBeNull()
  })

  it('PUT envia apenas formattedAddress + providerPlaceId (nunca lat/lng)', async () => {
    mockApiRequest.mockResolvedValue({ operationalBase: BASE, source: 'CLIENT_FALLBACK' })

    const result = await updateDriverOperationalBase({
      formattedAddress: BASE.formattedAddress,
      providerPlaceId: BASE.providerPlaceId as string,
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/drivers/me/operational-base', {
      method: 'PUT',
      body: {
        formattedAddress: BASE.formattedAddress,
        providerPlaceId: BASE.providerPlaceId,
      },
    })
    expect(result.providerPlaceId).toBe(BASE.providerPlaceId)
  })

  it('PUT rejeita seleção sem providerPlaceId (contrato OperationalBaseInput)', async () => {
    await expect(
      updateDriverOperationalBase({ formattedAddress: 'Rua digitada', providerPlaceId: '  ' }),
    ).rejects.toThrow('providerPlaceId é obrigatório')
    expect(mockApiRequest).not.toHaveBeenCalled()
  })
})