export function sanitizeDriverId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  if (!normalized) return null

  const lowered = normalized.toLowerCase()
  if (lowered === 'undefined' || lowered === 'null') return null

  return normalized
}

export function readStoredDriverId(): string | null {
  if (typeof window === 'undefined') return null
  return sanitizeDriverId(localStorage.getItem('driverId'))
}

export function resolveDriverId(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const sanitized = sanitizeDriverId(candidate)
    if (sanitized) return sanitized
  }
  return null
}

export function assertDriverId(value: string | null | undefined): string {
  const sanitized = sanitizeDriverId(value)
  if (!sanitized) {
    throw new Error('driverId ausente')
  }
  return sanitized
}
