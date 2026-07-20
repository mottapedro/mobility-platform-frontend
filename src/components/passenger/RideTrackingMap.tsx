import dynamic from 'next/dynamic'
import type { RideLocation } from '../../types'

type Props = {
  location: RideLocation | null
  isStale: boolean
}

const RideTrackingMapClient = dynamic<Props>(() => import('./RideTrackingMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-2xl bg-[#1A0E04]" />
  ),
})

export function RideTrackingMap(props: Props) {
  return <RideTrackingMapClient {...props} />
}
