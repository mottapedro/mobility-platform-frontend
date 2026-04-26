'use client'

import { useEffect, useState } from 'react'

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000))
}

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt))

  useEffect(() => {
    if (seconds === 0) return

    const id = setInterval(() => {
      const remaining = secondsUntil(expiresAt)
      setSeconds(remaining)
      if (remaining === 0) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [expiresAt, seconds])

  if (seconds === 0) {
    return (
      <span className="text-xs font-semibold text-red-400">Expirado</span>
    )
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`

  const urgent = seconds <= 30

  return (
    <span
      className={`text-xs font-semibold tabular-nums ${
        urgent ? 'text-red-400 animate-pulse' : 'text-zinc-400'
      }`}
    >
      Expira em {display}
    </span>
  )
}
