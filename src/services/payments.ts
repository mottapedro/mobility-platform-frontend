import { apiRequest } from './api'

export type BreakdownCode = 'TRANSPORT_SERVICE' | 'DRIVER_APPROACH' | 'PLATFORM_FEE'

export interface BreakdownItem {
  /** Stable code for the pricing component. */
  code: BreakdownCode
  label: string
  /** Persisted component value in cents. */
  amountCents: number
}

export interface PaymentIntentResponse {
  /** Base64-encoded PNG data (without data:image prefix). Used for the QR image. */
  qrCode?: string
  /** Alternative name some backends use for the base64 QR image data. */
  qrCodeBase64?: string
  /** Human-readable PIX key (e.g. CPF). */
  pixKey?: string
  /** EMVCo payload string (starts with '000201'). Goes ONLY to clipboard, never to img src. */
  pixCopiaCola?: string
  /** Amount in BRL. */
  amount: number
  /** Detailed pricing breakdown for Radical Transparency. */
  breakdown?: BreakdownItem[]
  status: string
  /** Allow any extra fields from backend response */
  [key: string]: unknown
}

/**
 * Checks if a string value looks like image data: either a base64-encoded PNG
 * (reasonable length, valid base64 chars) or an HTTP(S) URL, and NOT an EMVCo
 * copia-cola payload.
 */
function looksLikeBase64Image(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.length < 10) return false
  // EMVCo payloads always start with '000201'
  if (value.startsWith('000201')) return false
  // Accept HTTP(S) URLs (e.g. qrCodeImage from backend)
  if (/^https?:\/\//i.test(value)) return true
  // Must be mostly base64 characters
  const base64Regex = /^[A-Za-z0-9+/=]+$/
  const sample = value.slice(0, 200)
  return base64Regex.test(sample)
}

/**
 * Extracts the actual base64 image data from a payment-intent response.
 *
 * Strategy (in order):
 * 1. Check known QR-code fields: `qrCodeBase64`, `qrCode`
 * 2. Scan ALL string fields for something that looks like base64 image data
 * 3. Check `qrCodeUrl` (may be a full data:image URL)
 *
 * Handles both raw base64 (no prefix) and data:image/... prefixed strings.
 * Returns null if no valid image data is found.
 */
export function extractQrCodeImage(response: Record<string, unknown>): string | null {
  if (!response || typeof response !== 'object') return null

  // 1. Known QR code fields — prefer these
  for (const key of ['qrCodeBase64', 'qrCode', 'qrCodeImage', 'image', 'base64Image', 'qrImage']) {
    const val = response[key]
    if (looksLikeBase64Image(val)) {
      return val
    }
    // Also check if it's a data:image URL
    if (typeof val === 'string' && val.startsWith('data:image')) {
      // Extract base64 part after comma
      const comma = val.indexOf(',')
      if (comma !== -1) return val.slice(comma + 1)
      return val
    }
  }

  // 2. Fallback: scan ALL string values for something that looks like base64 image
  const allValues = Object.values(response)
  for (const val of allValues) {
    if (looksLikeBase64Image(val)) {
      return val
    }
    if (typeof val === 'string' && val.startsWith('data:image')) {
      const comma = val.indexOf(',')
      if (comma !== -1) return val.slice(comma + 1)
      return val
    }
  }

  // 3. Check qrCodeUrl as last resort (may be a URL, not base64)
  if (typeof response.qrCodeUrl === 'string' && response.qrCodeUrl.length > 0) {
    return response.qrCodeUrl
  }

  return null
}

export async function createPaymentIntent(
  rideId: string,
  // priceBrl is no longer sent to the backend — price is authoritative in the DB.
  // Parameter kept for call-site compatibility during rollout.
  _options?: { priceBrl?: number }
): Promise<PaymentIntentResponse> {
  const response = await apiRequest<Record<string, unknown>>(`/rides/${rideId}/payment-intent`, {
    method: 'POST',
    body: {},
  })

  return response as unknown as PaymentIntentResponse
}

export async function getPaymentStatus(rideId: string): Promise<PaymentIntentResponse> {
  return apiRequest(`/rides/${rideId}/payment-intent`)
}
