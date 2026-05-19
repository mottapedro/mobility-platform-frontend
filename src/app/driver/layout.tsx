'use client'

import { ProtectedRoute } from '../../components/AuthGuard'
import { AppHeader } from '../../components/AppHeader'
import { DriverBottomNav } from '../../components/driver/DriverBottomNav'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="driver">
      <AppHeader />
      <main className="min-h-screen bg-[#1E140F] px-4 pt-20 pb-24">{children}</main>
      <DriverBottomNav />
    </ProtectedRoute>
  )
}
