export interface PricingConfig {
  basePrice: number
  perKm: number
  perMin: number
  minPrice: number
}

export const DEFAULT_PRICING: PricingConfig = {
  basePrice: 5.0,
  perKm: 2.5,
  perMin: 0.5,
  minPrice: 8.0,
}

export function calculatePrice(
  distanceKm: number,
  durationMin: number,
  config: PricingConfig = DEFAULT_PRICING,
): number {
  const raw = config.basePrice + config.perKm * distanceKm + config.perMin * durationMin
  return Math.max(raw, config.minPrice)
}

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
