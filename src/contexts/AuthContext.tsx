'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'aliado:auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: AuthUser['role']) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Mock auth — replace with real API calls when backend auth is ready
// ---------------------------------------------------------------------------

const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 'driver-001',
    name: 'Motorista Demo',
    email: 'motorista@aliado.com',
    role: 'driver',
    password: '123456',
  },
  {
    id: 'b3a5278a-0ebf-4d97-8699-669951c8e41c',
    name: 'Passageiro Demo',
    email: 'passageiro@aliado.com',
    role: 'passenger',
    password: '123456',
  },
]

function findUser(email: string, password: string): AuthUser | null {
  const found = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!found) return null
  const { password: _pw, ...user } = found
  return user
}

// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
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
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 600))

    const matched = findUser(email, password)
    if (!matched) throw new Error('Email ou senha incorretos')

    localStorage.setItem(STORAGE_KEY, JSON.stringify(matched))
    if (matched.role === 'passenger') {
      localStorage.setItem('passengerId', matched.id)
    }
    setUser(matched)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, role: AuthUser['role']) => {
      await new Promise((r) => setTimeout(r, 600))

      const exists = MOCK_USERS.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
      if (exists) throw new Error('Este email já está cadastrado')

      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
      }

      MOCK_USERS.push({ ...newUser, password })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
      if (role === 'passenger') {
        localStorage.setItem('passengerId', newUser.id)
      }
      setUser(newUser)
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

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
