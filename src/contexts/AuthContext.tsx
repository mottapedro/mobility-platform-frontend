'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '../config/api'
import { redirectByRole } from '../utils/redirectByRole'
import type { AuthUser } from '../types'
const STORAGE_KEY = 'aliado:auth'
const TOKEN_KEY = 'aliado:token'

interface ApiAuthResponse {
  token?: string
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
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // normalise legacy uppercase roles from old deployments
        if (parsed?.role) parsed.role = parsed.role.toLowerCase()
        setUser(parsed)
      } catch { localStorage.removeItem(STORAGE_KEY) }
    }
    setLoading(false)
  }, [])

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
    if (data.passengerId) localStorage.setItem('passengerId', data.passengerId)
    if (data.driverId) localStorage.setItem('driverId', data.driverId)
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('passengerId')
    localStorage.removeItem('driverId')
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
