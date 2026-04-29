import { calculateDistanceKm } from './distance'

describe('calculateDistanceKm', () => {
  it('returns 0 for the same point', () => {
    expect(calculateDistanceKm(-23.55, -46.63, -23.55, -46.63)).toBe(0)
  })

  it('returns a positive distance for two different points', () => {
    const km = calculateDistanceKm(-23.55052, -46.63332, -23.56139, -46.65606)
    expect(km).toBeGreaterThan(0)
  })

  it('computes approx 2.9 km between two São Paulo coordinates', () => {
    // Av. Paulista to Parque Ibirapuera entrance
    const km = calculateDistanceKm(-23.56139, -46.65606, -23.5874, -46.6576)
    expect(km).toBeGreaterThan(2)
    expect(km).toBeLessThan(4)
  })

  it('is symmetric — distance A→B equals B→A', () => {
    const ab = calculateDistanceKm(-23.55, -46.63, -10.0, -67.8)
    const ba = calculateDistanceKm(-10.0, -67.8, -23.55, -46.63)
    expect(ab).toBeCloseTo(ba, 10)
  })
})
