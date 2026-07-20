export function isLocationStale(receivedAt: string, thresholdMs = 15000): boolean {
  return Date.now() - new Date(receivedAt).getTime() > thresholdMs
}
