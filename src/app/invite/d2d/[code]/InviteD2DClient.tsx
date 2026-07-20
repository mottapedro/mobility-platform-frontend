'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setStoredReferralCode, setStoredReferralInvite } from '../../../../utils/referral'

const BENEFITS = [
  { icon: '🌐', label: 'Sua rede vale mais' },
  { icon: '🚗', label: 'Mais corridas na sua região' },
  { icon: '🔁', label: 'Ganhos com recorrência' },
  { icon: '📈', label: 'Crescimento sustentável' },
]

export function InviteD2DClient({ code }: { code: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!code) return
    setStoredReferralCode(localStorage, code)
    setStoredReferralInvite(localStorage, { type: 'driver', referralCode: code })
  }, [code])

  function handleAccept() {
    // /register?ref= is the backend-governed onboarding entry point — it
    // resolves the invite server-side and injects referralCode into the
    // signup payload without touching the frozen registration form fields.
    router.push(`/register?ref=${encodeURIComponent(code)}`)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#1C1008] px-5 py-10 text-[#F5ECD8]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C25E14]">
            Convite Aliado · Rede de Motoristas
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">
            Seja um motorista Aliado na minha rede.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#F5ECD8]/70">
            Você foi convidado(a) por{' '}
            <span className="font-semibold text-[#C25E14]">{code}</span>. Uma nova
            forma de trabalhar com mais relacionamento, reconhecimento e
            oportunidades reais.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.label}
              className="flex flex-col gap-2 rounded-2xl border border-[#C25E14]/25 bg-[#2A1810] p-4"
            >
              <span className="text-xl">{benefit.icon}</span>
              <p className="text-xs font-semibold leading-5 text-[#F5ECD8]">{benefit.label}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleAccept}
        className="mx-auto w-full max-w-sm rounded-2xl bg-[#C25E14] py-4 text-base font-bold text-[#1C1008] transition-transform hover:opacity-90 active:scale-[0.98]"
      >
        Aceitar Convite e Cadastrar
      </button>
    </main>
  )
}
