import type { AuthUser } from '../types'

export function redirectByRole(role: AuthUser['role']): string {
  return role === 'driver' ? '/driver/offers' : '/passenger/rides'
}
