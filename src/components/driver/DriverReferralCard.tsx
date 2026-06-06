'use client'

import { useEffect, useState } from 'react'
import { ReferralLinkCard } from '../network/ReferralLinkCard'
import { useAuth } from '../../contexts/AuthContext'
import type { NetworkCapabilityContext } from '../../types/network-v2'

function avatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

interface DriverReferralCardProps {
  /** D2P invite URL from backend (GET /network/context → inviteUrls.driverToPassenger).
   *  Falls back to referralCode when absent. */
  d2pUrl?: string | null
  /** D2D invite URL from backend (GET /network/context → inviteUrls.driverToDriver).
   *  Falls back to referralCode when absent. */
  d2dUrl?: string | null
  /** Explicit capability flags from backend (NetworkContext.capabilities).
   *  When present, these govern render behaviour instead of URL-presence inference.
   *  Components MUST prefer capabilities over URL heuristics when both are available. */
  capabilities?: NetworkCapabilityContext | null
}

export function DriverReferralCard({ d2pUrl, d2dUrl, capabilities }: DriverReferralCardProps = {}) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user?.name) return null

  const origin = mounted ? window.location.origin : ''
  const normalizedD2pUrl = d2pUrl?.trim() || null
  const normalizedD2dUrl = d2dUrl?.trim() || null
  const normalizedReferralCode = user.referralCode?.trim() || null

  const fallbackD2pPath = normalizedReferralCode
    ? `/invite/d2p/${encodeURIComponent(normalizedReferralCode)}`
    : null
  const fallbackD2dPath = normalizedReferralCode
    ? `/invite/d2d/${encodeURIComponent(normalizedReferralCode)}`
    : null

  // D2P: backend URL first, then referralCode fallback.
  const resolvedD2pUrl = normalizedD2pUrl ?? (fallbackD2pPath ? `${origin}${fallbackD2pPath}` : null)
  const displayD2pUrl = normalizedD2pUrl ?? fallbackD2pPath

  // D2D: backend URL first, then referralCode fallback.
  // Keep D2D distinct from D2P when backend accidentally returns the same URL.
  const hasDistinctD2dUrl = !!normalizedD2dUrl && normalizedD2dUrl !== resolvedD2pUrl
  const resolvedD2dUrl = hasDistinctD2dUrl
    ? normalizedD2dUrl
    : fallbackD2dPath
      ? `${origin}${fallbackD2dPath}`
      : null
  const displayD2dUrl = hasDistinctD2dUrl ? normalizedD2dUrl : fallbackD2dPath

  // Capability resolution: explicit flags win over heuristics.
  const d2pEnabled = capabilities != null ? capabilities.canInvitePassengers : !!resolvedD2pUrl
  const shouldRenderD2dCard = capabilities != null ? capabilities.canInviteDrivers : true
  const d2dEnabled = shouldRenderD2dCard && !!resolvedD2dUrl

  if (!d2pEnabled && !shouldRenderD2dCard) return null

  const avatar = avatarLabel(user.name)

  return (
    <div className="flex flex-col gap-4">
      {d2pEnabled && resolvedD2pUrl && displayD2pUrl && (
        <div data-testid="driver-referral-d2p">
          <ReferralLinkCard
            eyebrow="Expandir demanda · D2P"
            title="Convidar Passageiros"
            description="Compartilhe seu link para criar relações persistentes com passageiros Aliado."
            displayUrl={displayD2pUrl}
            fullUrl={resolvedD2pUrl}
            whatsappText={`Agende corridas comigo pelo app Aliado\n${resolvedD2pUrl}`}
            avatarLabel={avatar}
          />
        </div>
      )}

      {shouldRenderD2dCard && (
        <div data-testid="driver-referral-d2d">
          <ReferralLinkCard
            eyebrow="Expandir rede · D2D"
            title="Convidar Motoristas"
            description="Amplie sua rede operacional convidando motoristas para a plataforma Aliado."
            displayUrl={displayD2dUrl ?? '/convite/motorista'}
            fullUrl={resolvedD2dUrl ?? ''}
            whatsappText={resolvedD2dUrl ? `Seja um motorista Aliado na minha rede\n${resolvedD2dUrl}` : ''}
            avatarLabel={avatar}
            disabled={!d2dEnabled}
          />
        </div>
      )}
    </div>
  )
}
