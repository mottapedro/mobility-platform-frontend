import { InviteD2DClient } from './InviteD2DClient'

export default async function InviteD2DPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <InviteD2DClient code={decodeURIComponent(code)} />
}
