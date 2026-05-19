'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useAlliedDriver } from '../../../hooks/useAlliedDriver'
import { AlliedDriverCard } from '../../../components/passenger/AlliedDriverCard'

export default function PassengerDriverPage() {
  const router = useRouter()
  const { user } = useAuth()
  const passengerId = user?.passengerId ?? ''
  const { alliedDriver, loading, error } = useAlliedDriver(passengerId)

  const whatsappLink = alliedDriver?.rawPhone
    ? `https://wa.me/55${alliedDriver.rawPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de agendar uma corrida pelo ALIADO.')}`
    : null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E6D2B3]">Meu motorista</h1>
        <p className="mt-1 text-sm text-[#E6D2B3]/50">Seu aliado pessoal de mobilidade</p>
      </div>

      <AlliedDriverCard
        driver={alliedDriver}
        loading={loading}
        error={error}
        onRequestRide={() => router.push('/passenger/create')}
      />

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#25D366] transition-all hover:border-[#25D366]/60 hover:bg-[#25D366]/15 active:scale-[0.98]"
        >
          <span className="text-base">💬</span>
          Conversar no WhatsApp
        </a>
      )}

      <div className="mt-6 rounded-[1.5rem] border border-[#E6D2B3]/8 bg-[#2B1E15] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#E6D2B3]/40">
          Como funciona
        </h3>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔗', title: 'Vínculo por indicação', desc: 'Você foi indicado por um motorista ALIADO e tem vínculo prioritário.' },
            { icon: '⭐', title: 'Prioridade nas corridas', desc: 'Suas solicitações são enviadas primeiro ao seu motorista aliado.' },
            { icon: '🤝', title: 'Relação de confiança', desc: 'Um motorista que já te conhece e prioriza seu atendimento.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <span className="shrink-0 text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#E6D2B3]">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-[#E6D2B3]/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
