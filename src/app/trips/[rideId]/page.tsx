import { TripTrackingClient } from './TripTrackingClient'

export default async function TripTrackingPage({
  params,
}: {
  params: Promise<{ rideId: string }>
}) {
  const { rideId } = await params
  return <TripTrackingClient rideId={rideId} />
}
