'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { AuthUser } from '../types'

interface Props {
  children: React.ReactNode
  requiredRole?: AuthUser['role']
}

/**
 * ProtectedRoute — wraps any page that requires authentication.
 *
 * Rules:
 *  - Not authenticated → redirect /login
 *  - requiredRole="driver"    → only users with role "driver" may access;
 *    passengers are redirected to /passenger/create
 *  - requiredRole="passenger" → only users with role "passenger" may access;
 *    drivers are redirected to /driver/offers
 */
export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (requiredRole && user.role !== requiredRole) {
      const fallback = user.role === 'driver' ? '/driver/offers' : '/passenger/create'
      router.replace(fallback)
    }
  }, [loading, user, requiredRole, router, pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    )
  }

  if (!user) return null
  if (requiredRole && user.role !== requiredRole) return null

  return <>{children}</>
}

/** @deprecated Use ProtectedRoute instead */
export { ProtectedRoute as AuthGuard }

