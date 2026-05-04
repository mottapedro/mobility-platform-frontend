'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'aliado:auth'
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface RegisterPayload {
  name: string
  email: string
  password: string
  role: AuthUser['role']
  phone: string
  referredByDriverId?: string
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
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    console.log('[LOGIN FRONTEND]', { email, api: `${BASE}/auth/login` })
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Email ou senha incorretos')

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as AuthUser['role'],
      ...(data.passengerId ? { passengerId: data.passengerId } : {}),
      ...(data.driverId ? { driverId: data.driverId } : {}),
      ...(data.referredByDriverId !== undefined ? { referredByDriverId: data.referredByDriverId } : {}),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    if (data.passengerId) localStorage.setItem('passengerId', data.passengerId)
    if (data.driverId) localStorage.setItem('driverId', data.driverId)
    setUser(authUser)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Erro ao cadastrar')

    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as AuthUser['role'],
      ...(data.passengerId ? { passengerId: data.passengerId } : {}),
      ...(data.driverId ? { driverId: data.driverId } : {}),
      ...(data.referredByDriverId !== undefined ? { referredByDriverId: data.referredByDriverId } : {}),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    if (data.passengerId) localStorage.setItem('passengerId', data.passengerId)
    if (data.driverId) localStorage.setItem('driverId', data.driverId)
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
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
