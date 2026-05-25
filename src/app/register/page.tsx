import RegisterPageClient from './RegisterPageClient'
import { fetchOnboardingContext } from '../../services/onboarding'
import { ApiError } from '../../services/api'
import type { OnboardingContext } from '../../types/network-v2'

export const dynamic = 'force-dynamic'

type RegisterPageProps = {
  searchParams: Promise<{ ref?: string }>
}

async function loadOnboarding(slug: string): Promise<OnboardingContext | null> {
  if (!slug) return null
  try {
    return await fetchOnboardingContext({ slug })
  } catch (err) {
    // Backend may not yet expose the V2 endpoint, may be down, or the slug
    // may be unknown. RegisterPageClient renders gracefully with `null`:
    // no role lock, the raw slug is forwarded as referralCode fallback.
    if (err instanceof ApiError) return null
    return null
  }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { ref } = await searchParams
  const referralSlug = typeof ref === 'string' ? ref : ''
  const onboarding = await loadOnboarding(referralSlug)

  return <RegisterPageClient referralSlug={referralSlug} onboarding={onboarding} />
}
