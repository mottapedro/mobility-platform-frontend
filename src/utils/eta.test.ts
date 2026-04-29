import { estimateETA } from './eta'

describe('estimateETA', () => {
  it('returns 0 for 0 km', () => {
    expect(estimateETA(0)).toBe(0)
  })

  it('returns 60 minutes for 40 km (city avg speed)', () => {
    expect(estimateETA(40)).toBe(60)
  })

  it('returns 30 minutes for 20 km', () => {
    expect(estimateETA(20)).toBe(30)
  })

  it('returns 1.5 minutes for 1 km', () => {
    expect(estimateETA(1)).toBeCloseTo(1.5)
  })

  it('scales linearly — double the distance doubles the time', () => {
    const eta10 = estimateETA(10)
    const eta20 = estimateETA(20)
    expect(eta20).toBeCloseTo(eta10 * 2)
  })
})
