'use client'

import type { RideContext } from '../../types'

interface Badge {
  key: keyof RideContext
  emoji: string
  label: string
  color: string
}

const BADGES: Badge[] = [
  {
    key: 'isVip',
    emoji: '⭐',
    label: 'VIP',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  {
    key: 'isAssistedTransport',
    emoji: '♿',
    label: 'Transporte Assistido',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  {
    key: 'isAirport',
    emoji: '✈️',
    label: 'Aeroporto',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  {
    key: 'isLuggage',
    emoji: '🧳',
    label: 'Bagagem',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
]

export function RideContextBadges({
  context,
}: {
  context?: RideContext | null
}) {
  if (!context) return null

  const active = BADGES.filter((b) => context[b.key])
  if (active.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {active.map((b) => (
        <span
          key={b.key}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${b.color}`}
        >
          {b.emoji} {b.label}
        </span>
      ))}
    </div>
  )
}
