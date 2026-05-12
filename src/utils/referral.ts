export const REFERRAL_CODE_STORAGE_KEY = 'aliado:referralCode'

export function normalizeReferralCode(value: string): string {
  return value.trim()
}

export function getStoredReferralCode(storage: Pick<Storage, 'getItem'>): string {
  return normalizeReferralCode(storage.getItem(REFERRAL_CODE_STORAGE_KEY) ?? '')
}

export function setStoredReferralCode(storage: Pick<Storage, 'setItem'>, value: string) {
  const normalizedValue = normalizeReferralCode(value)
  if (!normalizedValue) return
  storage.setItem(REFERRAL_CODE_STORAGE_KEY, normalizedValue)
}

export function clearStoredReferralCode(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(REFERRAL_CODE_STORAGE_KEY)
}

export function isInvalidReferralErrorMessage(message: string): boolean {
  return /referral|referencia|referência|motorista aliado|motorista indicado|convite inválido|invalid referral/i.test(message)
}