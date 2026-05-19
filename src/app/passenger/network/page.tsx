'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PassengerNetworkTree } from '../../../components/passenger/PassengerNetworkTree'
import { PassengerReferralCard } from '../../../components/passenger/PassengerReferralCard'
import { useAuth } from '../../../contexts/AuthContext'
import { usePassengerNetwork } from '../../../hooks/usePassengerNetwork'

export default function PassengerNetworkPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [passengerId, setPassengerId] = useState<string | null>(null)
  const { data, hierarchy, loading, error, refresh } = usePassengerNetwork(passengerId)

  useEffect(() => {
    const storedPassengerId = typeof window !== 'undefined' ? localStorage.getItem('passengerId') : null
    setPassengerId(user?.passengerId ?? storedPassengerId ?? null)
  }, [user])

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <PassengerReferralCard
          passengerId={passengerId}
          passengerName={user?.name}
          referralCode={hierarchy?.me.referralCode ?? null}
        />

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#F5ECD8]">Minha Rede</h1>
                <p className="mt-1 text-sm text-[#9A7D5A]">Passageiros indicados</p>
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2E1A08] text-[#9A7D5A] transition-colors hover:border-[#F28C28]/40 hover:text-[#F28C28]"
                  title="Atualizar"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          </div>

          {!passengerId && (
            <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-8 text-center">
              <p className="mb-4 text-[#9A7D5A]">Perfil de passageiro não encontrado.</p>
              <button
                onClick={() => router.push('/login')}
                className="rounded-xl bg-[#F28C28] px-6 py-3 text-sm font-bold text-[#0D0700]"
              >
                Ir para login
              </button>
            </div>
          )}

          {passengerId && (
            <PassengerNetworkTree
              passengerId={passengerId}
              passengerName={user?.name ?? 'Passageiro Aliado'}
              network={data}
              hierarchy={hierarchy}
              loading={loading}
              error={error}
              onRetry={refresh}
            />
          )}
    </div>
  )
}
