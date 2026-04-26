const AVG_CITY_SPEED_KMH = 40

/** Returns estimated travel time in minutes given a distance in km */
export function estimateETA(distanceKm: number): number {
  return (distanceKm / AVG_CITY_SPEED_KMH) * 60
}
