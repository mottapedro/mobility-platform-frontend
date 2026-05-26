'use client'

import { useEffect, useState } from 'react'
import { ReferralLinkCard } from '../network/ReferralLinkCard'
import { useAuth } from '../../contexts/AuthContext'

function avatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

interface DriverReferralCardProps {
  /** D2P invite URL from backend (GET /network/context → inviteUrls.driverToPassenger).
   *  Falls back to /r/{publicSlug} when absent — legacy behaviour until
   *  GET /drivers/me/invites is available. */
  d2pUrl?: string | null
  /** D2D invite URL from backend (GET /network/context → inviteUrls.driverToDriver).
   *  Card renders in disabled/pending state when absent. Frontend MUST NOT
   *  construct this URL — it depends on backend-governed invite semantics. */
  d2dUrl?: string | null
}

export function DriverReferralCard({ d2pUrl, d2dUrl }: DriverReferralCardProps = {}) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user?.name) return null
  if (!user.publicSlug && !d2pUrl) return null

  const origin = mounted ? window.location.origin : ''

  // D2P: use backend URL when provided, fall back to /r/{slug}
  const resolvedD2pUrl = d2pUrl ?? (user.publicSlug ? `${origin}/r/${user.publicSlug}` : null)
  const displayD2pUrl = d2pUrl ?? (user.publicSlug ? `/r/${user.publicSlug}` : null)

  const avatar = avatarLabel(user.name)

  return (
    <div className="flex flex-col gap-4">
      {resolvedD2pUrl && displayD2pUrl && (
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

      <div data-testid="driver-referral-d2d">
        <ReferralLinkCard
          eyebrow="Expandir rede · D2D"
          title="Convidar Motoristas"
          description="Amplie sua rede operacional convidando motoristas para a plataforma Aliado."
          displayUrl={d2dUrl ?? '/convite/motorista'}
          fullUrl={d2dUrl ?? ''}
          whatsappText={d2dUrl ? `Faça parte da minha rede operacional Aliado\n${d2dUrl}` : ''}
          avatarLabel={avatar}
          disabled={!d2dUrl}
        />
      </div>
    </div>
  )
}
