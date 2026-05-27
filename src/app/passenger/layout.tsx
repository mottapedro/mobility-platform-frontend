'use client'

import { ProtectedRoute } from '../../components/AuthGuard'
import { AppHeader } from '../../components/AppHeader'
import { PassengerBottomNav } from '../../components/passenger/PassengerBottomNav'
import { DomainRuntimeProvider } from '../../contexts/domains/DomainRuntimeContext'
import { RelationshipDomainProvider } from '../../contexts/domains/RelationshipDomainProvider'
import { OperationalDomainProvider } from '../../contexts/domains/OperationalDomainProvider'
import { EconomicDomainProvider } from '../../contexts/domains/EconomicDomainProvider'

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="passenger">
      <DomainRuntimeProvider>
        <RelationshipDomainProvider>
          <OperationalDomainProvider>
            <EconomicDomainProvider>
              <AppHeader />
              <main className="min-h-screen bg-[#0D0700] px-4 pt-20 pb-24">{children}</main>
              <PassengerBottomNav />
            </EconomicDomainProvider>
          </OperationalDomainProvider>
        </RelationshipDomainProvider>
      </DomainRuntimeProvider>
    </ProtectedRoute>
  )
}
