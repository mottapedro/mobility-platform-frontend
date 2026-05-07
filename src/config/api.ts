const isTestEnv = process.env.NODE_ENV === 'test'
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? (isTestEnv ? 'http://localhost:3000' : '')

function normalizeApiUrl(value: string): string {
  if (!value) return value
  const trimmed = value.trim().replace(/\/+$/, '')

  try {
    const parsed = new URL(trimmed)
    const pathname = parsed.pathname.replace(/\/+$/, '')

    if (pathname === '/auth' || pathname === '/auth/login' || pathname === '/auth/register') {
      return parsed.origin
    }

    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return trimmed
  }
}

export const API_URL = normalizeApiUrl(rawApiUrl) as string

if (!API_URL && !isTestEnv) {
  throw new Error('NEXT_PUBLIC_API_URL não definida')
}
