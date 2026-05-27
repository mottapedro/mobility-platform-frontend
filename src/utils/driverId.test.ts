import { assertDriverId, resolveDriverId, sanitizeDriverId } from './driverId'

describe('driverId utils', () => {
  it('sanitizes invalid values to null', () => {
    expect(sanitizeDriverId(null)).toBeNull()
    expect(sanitizeDriverId(undefined)).toBeNull()
    expect(sanitizeDriverId('')).toBeNull()
    expect(sanitizeDriverId('   ')).toBeNull()
    expect(sanitizeDriverId('undefined')).toBeNull()
    expect(sanitizeDriverId(' null ')).toBeNull()
  })

  it('keeps valid ids with trimming', () => {
    expect(sanitizeDriverId(' drv_123 ')).toBe('drv_123')
  })

  it('resolves first valid candidate', () => {
    expect(resolveDriverId('undefined', null, ' drv_789 ')).toBe('drv_789')
    expect(resolveDriverId(' ', null, undefined)).toBeNull()
  })

  it('asserts when driverId is missing', () => {
    expect(() => assertDriverId('undefined')).toThrow('driverId ausente')
    expect(assertDriverId(' drv_111 ')).toBe('drv_111')
  })
})
