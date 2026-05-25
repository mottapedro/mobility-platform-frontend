'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReferralLinkCard } from '../network/ReferralLinkCard'
import { buildPassengerReferralSlug } from '../../services/passengers'

interface PassengerReferralCardProps {
  passengerId?: string | null
  passengerName?: string
  referralCode?: string | null
}

function avatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

export function PassengerReferralCard({ passengerId, passengerName = '', referralCode }: PassengerReferralCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const code = useMemo(() => {
    const backendCode = referralCode?.trim()
    if (backendCode) return backendCode
    return passengerName ? buildPassengerReferralSlug(passengerName) : ''
  }, [passengerName, referralCode])

  const origin = mounted ? window.location.origin : ''
  const query = passengerId ? `?originPassengerId=${encodeURIComponent(passengerId)}` : ''
  const fullUrl = code ? `${origin}/r/${code}${query}` : ''
  const displayUrl = code ? `/r/${code}` : '/r/seu-link'

  return (
    <ReferralLinkCard
      eyebrow="Link publico"
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
