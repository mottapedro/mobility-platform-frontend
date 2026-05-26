import type { AuthUser } from '../types'

export const ROLE_ENTRYPOINT: Record<AuthUser['role'], string> = {
  driver: '/driver/offers',
  passenger: '/passenger',
}

export function redirectByRole(role: AuthUser['role']): string {
  return ROLE_ENTRYPOINT[role] ?? '/login'
}
