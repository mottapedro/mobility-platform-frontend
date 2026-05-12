import {
  buildDriverSlug,
  findDriverByReferralSlug,
  formatDriverPhone,
  getRegionLabelFromSlug,
  toDriverReferralProfile,
  type DriverSummary,
} from './drivers'

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