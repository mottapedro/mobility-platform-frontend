import type { NetworkInviteUrls } from '../types/network-v2'

export type InviteFlow = 'd2d' | 'd2p' | 'p2p'

function normalize(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function resolveInviteUrl(
  inviteUrls: NetworkInviteUrls | null | undefined,
  flow: InviteFlow,
): string | null {
  if (!inviteUrls) return null

  if (flow === 'd2d') {
    return normalize(inviteUrls.d2d) ?? normalize(inviteUrls.driverToDriver)
  }
  if (flow === 'd2p') {
    return normalize(inviteUrls.d2p) ?? normalize(inviteUrls.driverToPassenger)
  }
  return normalize(inviteUrls.p2p) ?? normalize(inviteUrls.passengerToPassenger)
}
