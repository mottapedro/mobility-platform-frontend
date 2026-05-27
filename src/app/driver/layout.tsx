'use client'

import { ProtectedRoute } from '../../components/AuthGuard'
import { AppHeader } from '../../components/AppHeader'
import { DriverBottomNav } from '../../components/driver/DriverBottomNav'
import { DomainRuntimeProvider } from '../../contexts/domains/DomainRuntimeContext'
import { RelationshipDomainProvider } from '../../contexts/domains/RelationshipDomainProvider'
import { OperationalDomainProvider } from '../../contexts/domains/OperationalDomainProvider'
import { EconomicDomainProvider } from '../../contexts/domains/EconomicDomainProvider'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="driver">
      <DomainRuntimeProvider>
        <RelationshipDomainProvider>
          <OperationalDomainProvider>
            <EconomicDomainProvider>
              <AppHeader />
              <main className="min-h-screen bg-[#0D0700] px-4 pt-20 pb-24">{children}</main>
              <DriverBottomNav />
            </EconomicDomainProvider>
          </OperationalDomainProvider>
        </RelationshipDomainProvider>
      </DomainRuntimeProvider>
    </ProtectedRoute>
  )
}
