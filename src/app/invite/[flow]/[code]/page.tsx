import { redirect } from 'next/navigation'

/**
 * /invite/[flow]/[code] → /r/[code]
 *
 * The backend emits invite URLs with the pattern /invite/d2p/[referralCode]
 * and /invite/d2d/[referralCode].  The canonical referral landing page lives
 * at /r/[slug], which already accepts both publicSlug and referralCode values
 * as the slug (backend resolves by referralCode when no publicSlug matches).
 *
 * The [flow] segment is intentionally discarded: flowType (DRIVER_TO_PASSENGER
 * vs DRIVER_TO_DRIVER) is determined by the backend from the referralCode
 * context and returned in OnboardingContext.flowType — the frontend must not
 * infer it from the URL path.
 */
export default async function InviteRedirectPage({
  params,
}: {
  params: Promise<{ flow: string; code: string }>
}) {
  const { code } = await params
  redirect(`/r/${encodeURIComponent(code)}`)
}
