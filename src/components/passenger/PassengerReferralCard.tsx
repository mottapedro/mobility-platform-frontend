'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReferralLinkCard } from '../network/ReferralLinkCard'
import { buildPassengerReferralSlug } from '../../services/passengers'

interface PassengerReferralCardProps {
  passengerId?: string | null
  passengerName?: string
  referralCode?: string | null
  /** Explicit PASSENGER_TO_PASSENGER invite URL from backend context. */
  p2pUrl?: string | null
}

function avatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

export function PassengerReferralCard({
  passengerId,
  passengerName = '',
  referralCode,
  p2pUrl,
}: PassengerReferralCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const code = useMemo(() => {
    const explicit = p2pUrl?.trim()
    if (explicit) return explicit
    const backendCode = referralCode?.trim()
    if (backendCode) return backendCode
    return passengerName ? buildPassengerReferralSlug(passengerName) : ''
  }, [passengerName, p2pUrl, referralCode])

  const origin = mounted ? window.location.origin : ''
  const explicitP2pUrl = p2pUrl?.trim() || null
  const query = passengerId ? `?originPassengerId=${encodeURIComponent(passengerId)}` : ''
  const fullUrl = explicitP2pUrl ?? (code ? `${origin}/r/${code}${query}` : '')
  const displayUrl = explicitP2pUrl ?? (code ? `/r/${code}` : '/r/seu-link')

  return (
    <ReferralLinkCard
      eyebrow="Expandir rede · P2P"
      title="Convide passageiros"
      description="Sua rede cresce a partir de convites diretos e relacoes de confianca."
      displayUrl={displayUrl}
      fullUrl={fullUrl}
      whatsappText={`Entre na minha rede Aliado e agende suas corridas com atendimento concierge.\n${fullUrl}`}
      avatarLabel={avatarLabel(passengerName)}
      disabled={!code}
    />
  )
}
