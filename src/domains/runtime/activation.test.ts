import { buildDomainRuntimeSnapshot, classifyDomainRoute } from './activation'

describe('domain activation runtime', () => {
  test('classifies known routes', () => {
    expect(classifyDomainRoute('/driver/network')).toBe('relationship')
    expect(classifyDomainRoute('/driver/offers')).toBe('operational')
    expect(classifyDomainRoute('/driver/ganhos')).toBe('economic')
    expect(classifyDomainRoute('/driver/unknown')).toBe('unknown')
  })

  test('enables economic domain only when ready and identified', () => {
    const activeSnapshot = buildDomainRuntimeSnapshot({
      pathname: '/driver/ganhos',
      authReady: true,
      hydrationReady: true,
      role: 'driver',
      driverId: 'drv-123',
      passengerId: null,
    })

    const blockedSnapshot = buildDomainRuntimeSnapshot({
      pathname: '/driver/ganhos',
      authReady: true,
      hydrationReady: true,
      role: 'driver',
      driverId: null,
      passengerId: null,
    })

    expect(activeSnapshot.domains.economic.enabled).toBe(true)
    expect(activeSnapshot.domains.economic.hasIdentity).toBe(true)

    expect(blockedSnapshot.domains.economic.enabled).toBe(false)
    expect(blockedSnapshot.domains.economic.hasIdentity).toBe(false)
  })
})
