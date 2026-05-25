import { Star } from 'lucide-react'
import Link from 'next/link'

import { ReferralRegisterButton } from '../../../components/driver/ReferralRegisterButton'
import { ReferralCapture } from '../../../components/referral/ReferralCapture'
import { getDriverByReferralSlug } from '../../../services/drivers'

export const dynamic = 'force-dynamic'

type DriverReferralLandingPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    originPassengerId?: string
  }>
}

export default async function DriverReferralLandingPage(props: DriverReferralLandingPageProps) {
  const { slug } = await props.params
  const searchParams = props.searchParams ? await props.searchParams : {}
  const driver = await getDriverByReferralSlug(slug)
  const originPassengerId = searchParams.originPassengerId

  if (!driver) {
    return (
      <main
        className="min-h-screen bg-[#120b07] px-4 py-8 text-[#F6E8D2]"
        style={{ background: 'radial-gradient(circle at top, rgba(242,140,40,0.24), transparent 35%), linear-gradient(180deg, #20120b 0%, #120b07 55%, #0d0806 100%)' }}
      >
        <ReferralCapture referralCode={slug} inviteType="passenger" originPassengerId={originPassengerId} />
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <div className="rounded-[2rem] border border-white/10 bg-[#1f140f]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
              Convite Aliado
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
              Entre para uma rede de passageiros
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#F6E8D2]/70">
              Seu convite foi salvo. Ao criar sua conta, o referral será aplicado automaticamente para manter a relação dentro do ecossistema.
            </p>
            <div className="mt-6 rounded-2xl border border-[#F28C28]/20 bg-[#F28C28]/8 p-4">
              <p className="font-mono text-sm text-[#F6E8D2]/80">/r/{slug}</p>
            </div>
            <Link
              href={`/register?ref=${encodeURIComponent(slug)}`}
              className="mt-6 block w-full rounded-2xl bg-[#F28C28] px-6 py-4 text-center text-base font-semibold text-[#120b07] transition-transform hover:scale-[1.01] hover:bg-[#ff9f43] active:scale-[0.99]"
            >
              Criar conta com convite
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#120b07] px-4 py-8 text-[#F6E8D2]"
      style={{ background: 'radial-gradient(circle at top, rgba(242,140,40,0.24), transparent 35%), linear-gradient(180deg, #20120b 0%, #120b07 55%, #0d0806 100%)' }}
    >
      <ReferralCapture
        referralCode={driver.referralCode ?? slug}
        inviteType="driver"
        originDriverId={driver.id}
        name={driver.name}
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-[#1f140f]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 text-2xl font-bold text-[#FAD2A4]">
              {driver.avatarLabel}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
                Motorista Aliado
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-white">{driver.name}</h1>
              <p className="mt-1 text-sm text-[#F6E8D2]/60">{driver.headline}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Regiao</p>
              <p className="mt-2 text-base font-medium text-white">{driver.regionLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Veiculo</p>
              <p className="mt-2 text-base font-medium text-white">{driver.vehicleLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Nota</p>
              <p className="mt-2 flex items-center gap-2 text-base font-medium text-white">
                <Star size={16} className="text-[#F28C28]" fill="currentColor" />
                {driver.ratingLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Contato</p>
              <p className="mt-2 text-base font-medium text-white">{driver.phoneLabel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#F28C28]/20 bg-[#F28C28]/8 p-4">
            <p className="text-sm leading-6 text-[#F6E8D2]/80">
              Cadastre-se com o referral deste motorista e entre no fluxo de agendamento com prioridade e atendimento mais direto.
            </p>
          </div>

          <div className="mt-6">
            <ReferralRegisterButton driver={driver} slug={driver.slug} />
          </div>
        </div>
      </div>
    </main>
  )
}
