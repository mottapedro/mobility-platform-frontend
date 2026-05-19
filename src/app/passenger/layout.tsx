'use client'

import { ProtectedRoute } from '../../components/AuthGuard'
import { AppHeader } from '../../components/AppHeader'
import { PassengerBottomNav } from '../../components/passenger/PassengerBottomNav'

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="passenger">
      <AppHeader />
      <main className="min-h-screen bg-[#0D0700] px-4 pt-20 pb-24">{children}</main>
      <PassengerBottomNav />
    </ProtectedRoute>
  )
}
