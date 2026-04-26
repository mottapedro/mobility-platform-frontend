import dynamic from 'next/dynamic'

type Props = {
  origin: string
  destination: string
}

const RideMapClient = dynamic<Props>(() => import('./RideMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded-xl bg-zinc-800" />
  ),
})

export function RideMap(props: Props) {
  return <RideMapClient {...props} />
}
