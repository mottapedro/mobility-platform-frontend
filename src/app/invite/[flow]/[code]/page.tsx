import { redirect } from 'next/navigation'

/**
 * /invite/[flow]/[code] → /r/[code]
 *
 * The backend emits invite URLs with the pattern /invite/d2p/[referralCode]
 * and /invite/d2d/[referralCode].  The canonical referral landing page lives
 * at /r/[slug], which already accepts both publicSlug and referralCode values
 * as the slug (backend resolves by referralCode when no publicSlug matches).
 *
 * The [flow] segment is passed along as a query parameter (?flow=) so that the
 * frontend component remains free of business logic, delegating the resolution
 * to the backend through the fetcher.
 */
export default async function InviteRedirectPage({
  params,
}: {
  params: Promise<{ flow: string; code: string }>
}) {
  const { flow, code } = await params;
  const flowParam = flow ? `?flow=${encodeURIComponent(flow)}` : '';
  redirect(`/r/${encodeURIComponent(code)}${flowParam}`);
}
