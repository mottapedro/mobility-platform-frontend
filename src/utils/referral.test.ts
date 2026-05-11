import {
  clearStoredReferralCode,
  getStoredReferralCode,
  isInvalidReferralErrorMessage,
  REFERRAL_CODE_STORAGE_KEY,
  setStoredReferralCode,
} from './referral'

describe('referral storage helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and restores the referral code', () => {
    setStoredReferralCode(localStorage, 'carlos-zs')

    expect(localStorage.getItem(REFERRAL_CODE_STORAGE_KEY)).toBe('carlos-zs')
    expect(getStoredReferralCode(localStorage)).toBe('carlos-zs')
  })

  it('normalizes and clears stored values', () => {
    setStoredReferralCode(localStorage, '  pedro-zn  ')
    expect(getStoredReferralCode(localStorage)).toBe('pedro-zn')

    clearStoredReferralCode(localStorage)
    expect(getStoredReferralCode(localStorage)).toBe('')
  })

  it('detects invalid referral backend messages', () => {
    expect(isInvalidReferralErrorMessage('Invalid referral code')).toBe(true)
    expect(isInvalidReferralErrorMessage('Link de referência expirado')).toBe(true)
    expect(isInvalidReferralErrorMessage('Erro ao cadastrar')).toBe(false)
  })
})