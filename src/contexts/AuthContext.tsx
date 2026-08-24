'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { API_URL } from '../config/api'
import { redirectByRole } from '../utils/redirectByRole'
import type { AuthUser } from '../types'
import {
  AUTH_INVALIDATED_EVENT,
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  clearStoredAuth,
} from '../services/api'

interface ApiAuthResponse {
  token?: string
  accessToken?: string
  user: { id: string; name: string; email: string; role: string }
  driverId?: string
  passengerId?: string
  publicSlug?: string
  referralCode?: string
  referredByDriverId?: string | null
  error?: string
  message?: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  role: AuthUser['role']
  phone: string
  referralCode?: string
  // driver-specific
  experienceLevel?: string
  vehicle?: { model: string; brand: string; plate: string; category: string }
  region?: string[]
  operationalBase?: { formattedAddress: string; providerPlaceId: string }
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const bootstrapCompleted = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  const redirectToLogin = useCallback(() => {
    if (pathname !== '/login') router.replace('/login')
  }, [pathname, router])

  const invalidateSession = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    redirectToLogin()
  }, [redirectToLogin])

  const parseStoredUser = useCallback((stored: string): AuthUser | null => {
    try {
      const parsed = JSON.parse(stored) as Partial<AuthUser>
      const role = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : ''
      if (
        typeof parsed.id !== 'string' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.email !== 'string' ||
        (role !== 'passenger' && role !== 'driver')
      ) {
        return null
      }
      return { ...parsed, role } as AuthUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (bootstrapCompleted.current) return
    bootstrapCompleted.current = true

    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

    if (!stored && !token) {
      setLoading(false)
      return
    }

    const parsed = stored && token ? parseStoredUser(stored) : null
    if (!parsed) {
      clearStoredAuth()
      setUser(null)
      redirectToLogin()
    } else {
      setUser(parsed)
    }
    setLoading(false)
  }, [parseStoredUser, redirectToLogin])

  useEffect(() => {
    const onAuthInvalidated = () => invalidateSession()
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY && event.key !== AUTH_TOKEN_STORAGE_KEY) return

      if (event.newValue === null) {
        invalidateSession()
        return
      }

      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      const parsed = stored && token ? parseStoredUser(stored) : null
      if (parsed) {
        setUser(parsed)
      } else {
        invalidateSession()
      }
    }

    window.addEventListener(AUTH_INVALIDATED_EVENT, onAuthInvalidated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, onAuthInvalidated)
      window.removeEventListener('storage', onStorage)
    }
  }, [invalidateSession, parseStoredUser])

  const login = useCallback(async (email: string, password: string) => {
    const url = `${API_URL}/auth/login`
    console.log('[LOGIN] →', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_URL?.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
      body: JSON.stringify({ email, password }),
    })
    console.log('[LOGIN] status', res.status, res.ok)
    const text = await res.text()
    let data = {} as ApiAuthResponse
    try { data = JSON.parse(text) as ApiAuthResponse } catch { /* non-JSON body */ }
    console.log('[LOGIN] data', data)
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Email ou senha incorretos')
    if (!data.user) throw new Error('Resposta inválida do servidor')

    const accessToken = data.accessToken ?? data.token
    if (!accessToken) throw new Error('Authentication response missing access token')

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role.toLowerCase() as AuthUser['role'],
      ...(data.passengerId ? { passengerId: data.passengerId } : {}),
      ...(data.driverId ? { driverId: data.driverId } : {}),
      ...(data.publicSlug ? { publicSlug: data.publicSlug } : {}),
      ...(data.referralCode ? { referralCode: data.referralCode } : {}),
      ...(data.referredByDriverId != null ? { referredByDriverId: data.referredByDriverId } : {}),
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken)
    if (data.passengerId) localStorage.setItem('passengerId', data.passengerId)
    if (data.driverId) localStorage.setItem('driverId', data.driverId)
    setUser(authUser)

    // smart redirect based on role
    router.replace(redirectByRole(authUser.role))
  }, [router])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_URL?.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let data = {} as ApiAuthResponse
    try { data = JSON.parse(text) as ApiAuthResponse } catch { /* non-JSON body */ }
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Erro ao cadastrar')
    if (!data.user) throw new Error('Resposta inválida do servidor')

    const accessToken = data.accessToken ?? data.token
    if (!accessToken) throw new Error('Authentication response missing access token')

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role.toLowerCase() as AuthUser['role'],
      ...(data.passengerId ? { passengerId: data.passengerId } : {}),
      ...(data.driverId ? { driverId: data.driverId } : {}),
      ...(data.publicSlug ? { publicSlug: data.publicSlug } : {}),
      ...(data.referralCode ? { referralCode: data.referralCode } : {}),
      ...(data.referredByDriverId != null ? { referredByDriverId: data.referredByDriverId } : {}),
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken)
    if (data.passengerId) localStorage.setItem('passengerId', data.passengerId)
    if (data.driverId) localStorage.setItem('driverId', data.driverId)
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
