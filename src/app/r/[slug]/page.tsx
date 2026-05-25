import Link from 'next/link'

import { ReferralCapture } from '../../../components/referral/ReferralCapture'
import { fetchOnboardingContext } from '../../../services/onboarding'
import { ApiError } from '../../../services/api'
import { RootDriverCard } from '../../../components/network/v2/RootDriverCard'
import type { OnboardingContext } from '../../../types/network-v2'

export const dynamic = 'force-dynamic'

type DriverReferralLandingPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    originPassengerId?: string
  }>
}

const PAGE_BACKGROUND =
  'radial-gradient(circle at top, rgba(242,140,40,0.24), transparent 35%), linear-gradient(180deg, #20120b 0%, #120b07 55%, #0d0806 100%)'

async function loadOnboarding(slug: string): Promise<OnboardingContext | null> {
  try {
    return await fetchOnboardingContext({ slug })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

function NotFoundView({ slug, originPassengerId }: { slug: string; originPassengerId?: string }) {
  return (
    <main
      className="min-h-screen bg-[#120b07] px-4 py-8 text-[#F6E8D2]"
      style={{ background: PAGE_BACKGROUND }}
    >
      <ReferralCapture
        referralCode={slug}
        inviteType="passenger"
        originPassengerId={originPassengerId}
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-[#1f140f]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
            Convite Aliado
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
            Convite não encontrado
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#F6E8D2]/70">
            O link <span className="font-mono">/r/{slug}</span> não foi reconhecido,
            mas seu convite foi salvo. Você ainda pode criar sua conta — ela será
            associada se o link for restaurado.
          </p>
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

export default async function DriverReferralLandingPage(props: DriverReferralLandingPageProps) {
  const { slug } = await props.params
  const searchParams = props.searchParams ? await props.searchParams : {}
  const originPassengerId = searchParams.originPassengerId

  const onboarding = await loadOnboarding(slug)
  if (!onboarding) {
    return <NotFoundView slug={slug} originPassengerId={originPassengerId} />
  }

  const { invite, rootDriver, expectedActor } = onboarding
  const inviteType = expectedActor === 'driver' ? 'driver' : 'passenger'
  const ctaCopy =
    expectedActor === 'driver'
      ? 'Entrar na rede de motoristas'
      : 'Criar conta com convite'

  return (
    <main
      className="min-h-screen bg-[#120b07] px-4 py-8 text-[#F6E8D2]"
      style={{ background: PAGE_BACKGROUND }}
    >
      {/* Legacy capture stays through Phase 3 — backend already governs the
       *  invite via `invite.code`; we still write the URL slug so the V1
       *  /register reader keeps working until it is rewired. */}
      <ReferralCapture
        referralCode={slug}
        inviteType={inviteType}
        originPassengerId={originPassengerId}
        originDriverId={rootDriver?.id}
        name={invite.inviter.name}
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center gap-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#1f140f]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
            Convite Aliado · {onboarding.flowType.replace(/_/g, ' ')}
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-white">
            {invite.displayLabel}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#F6E8D2]/70">
            Código do convite:{' '}
            <span className="font-mono text-[#F6E8D2]/90">{invite.code}</span>
          </p>

          <Link
            href={`/register?ref=${encodeURIComponent(slug)}`}
            className="mt-6 block w-full rounded-2xl bg-[#F28C28] px-6 py-4 text-center text-base font-semibold text-[#120b07] transition-transform hover:scale-[1.01] hover:bg-[#ff9f43] active:scale-[0.99]"
          >
            {ctaCopy}
          </Link>
        </div>

        {rootDriver && (
          <RootDriverCard rootDriver={rootDriver} className="!bg-[#1f140f]/90" />
        )}
      </div>
    </main>
  )
}
