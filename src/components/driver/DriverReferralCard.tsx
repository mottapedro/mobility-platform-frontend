'use client'

import { useEffect, useState } from 'react'
import { ReferralLinkCard } from '../network/ReferralLinkCard'
import { useAuth } from '../../contexts/AuthContext'

function avatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'AL'
}

export function DriverReferralCard() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user?.name) return null
  // Always use the slug persisted by the backend — never derive from name
  if (!user.publicSlug) return null

  const slug = user.publicSlug
  const origin = mounted ? window.location.origin : ''
  const url = `${origin}/r/${slug}`

  return (
    <ReferralLinkCard
      eyebrow="Seu link de indicacao"
      title="Convide passageiros"
      description="Compartilhe seu link para criar relacoes persistentes com passageiros Aliado."
      displayUrl={`/r/${slug}`}
      fullUrl={url}
      whatsappText={`Agende sua corrida comigo pelo app Aliado\n${url}`}
      avatarLabel={avatarLabel(user.name)}
    />
  )
}
