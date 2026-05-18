export const REFERRAL_CODE_STORAGE_KEY = 'aliado:referralCode'
export const REFERRAL_INVITE_STORAGE_KEY = 'aliado:referralInvite'
export const ORIGIN_PASSENGER_ID_STORAGE_KEY = 'aliado:originPassengerId'

export type ReferralInviteType = 'driver' | 'passenger'

export interface StoredReferralInvite {
  type: ReferralInviteType
  referralCode: string
  originPassengerId?: string
  originDriverId?: string
  name?: string
}

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

export function getStoredOriginPassengerId(storage: Pick<Storage, 'getItem'>): string {
  return normalizeReferralCode(storage.getItem(ORIGIN_PASSENGER_ID_STORAGE_KEY) ?? '')
}

export function setStoredOriginPassengerId(storage: Pick<Storage, 'setItem'>, value: string) {
  const normalizedValue = normalizeReferralCode(value)
  if (!normalizedValue) return
  storage.setItem(ORIGIN_PASSENGER_ID_STORAGE_KEY, normalizedValue)
}

export function clearStoredOriginPassengerId(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(ORIGIN_PASSENGER_ID_STORAGE_KEY)
}

export function getStoredReferralInvite(storage: Pick<Storage, 'getItem'>): StoredReferralInvite | null {
  const value = storage.getItem(REFERRAL_INVITE_STORAGE_KEY)
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as StoredReferralInvite
    if (!parsed.referralCode || !parsed.type) return null
    return parsed
  } catch {
    return null
  }
}

export function setStoredReferralInvite(storage: Pick<Storage, 'setItem'>, invite: StoredReferralInvite) {
  const referralCode = normalizeReferralCode(invite.referralCode)
  if (!referralCode) return
  storage.setItem(REFERRAL_INVITE_STORAGE_KEY, JSON.stringify({ ...invite, referralCode }))
}

export function clearStoredReferralInvite(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(REFERRAL_INVITE_STORAGE_KEY)
}

export function isInvalidReferralErrorMessage(message: string): boolean {
  return /referral|referencia|referencia|motorista aliado|motorista indicado|convite invalido|invalid referral/i.test(message.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
}
  export function isInvalidReferralErrorMessage(message: string): boolean {
    return /referral|referencia|motorista aliado|motorista indicado|convite invalido|invalid referral|invalido|expirado/i.test(
      message.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
  }
