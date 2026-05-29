import { request as pwRequest, APIRequestContext } from '@playwright/test'

export interface LoginDriverResult {
  user: { id: string; name: string; email: string; role: 'driver' }
  driverId: string
  referralCode: string
  publicSlug: string | null
  networkLevel: number
  referredByDriverId: string | null
}

export interface LoginPassengerResult {
  user: { id: string; name: string; email: string; role: 'passenger' }
  passengerId: string
  referredByDriverId: string | null
}

export interface RideOffer {
  id: string
  driverId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  expiresAt: string
  rideRequest: {
    id: string
    origin: string
    destination: string
    scheduledAt: string
    status: string
  }
}

export class SmokeApi {
  private constructor(private readonly ctx: APIRequestContext, private readonly baseUrl: string) {}

  static async create(baseUrl: string): Promise<SmokeApi> {
    const ctx = await pwRequest.newContext({ baseURL: baseUrl })
    return new SmokeApi(ctx, baseUrl)
  }

  async dispose() {
    await this.ctx.dispose()
  }

  async loginDriver(email: string, password: string): Promise<LoginDriverResult> {
    const res = await this.ctx.post('/auth/login', { data: { email, password } })
    if (!res.ok()) throw new Error(`Driver login failed (${res.status()}): ${await res.text()}`)
    const body = (await res.json()) as LoginDriverResult
    if (body.user.role !== 'driver') throw new Error(`Expected driver role, got ${body.user.role}`)
    return body
  }

  async loginPassenger(email: string, password: string): Promise<LoginPassengerResult> {
    const res = await this.ctx.post('/auth/login', { data: { email, password } })
    if (!res.ok()) throw new Error(`Passenger login failed (${res.status()}): ${await res.text()}`)
    const body = (await res.json()) as LoginPassengerResult
    if (body.user.role !== 'passenger') throw new Error(`Expected passenger role, got ${body.user.role}`)
    return body
  }

  async createRide(input: {
    passengerId: string
    origin: string
    destination: string
    scheduledAt: string
  }): Promise<{ id: string; status: string }> {
    const res = await this.ctx.post('/rides', { data: input })
    if (res.status() !== 201 && res.status() !== 200) {
      throw new Error(`POST /rides failed (${res.status()}): ${await res.text()}`)
    }
    return (await res.json()) as { id: string; status: string }
  }

  async getRide(rideId: string): Promise<{ id: string; status: string; selectedDriverId: string | null }> {
    const res = await this.ctx.get(`/rides/${rideId}`)
    if (!res.ok()) throw new Error(`GET /rides/${rideId} failed (${res.status()})`)
    return (await res.json()) as { id: string; status: string; selectedDriverId: string | null }
  }

  async listDriverOffers(driverId: string): Promise<RideOffer[]> {
    const res = await this.ctx.get(`/drivers/${driverId}/offers`, {
      headers: { 'x-driver-id': driverId },
    })
    if (!res.ok()) throw new Error(`GET /drivers/${driverId}/offers failed (${res.status()})`)
    return (await res.json()) as RideOffer[]
  }

  async respondOffer(offerId: string, accept: boolean): Promise<{ accepted: boolean }> {
    const res = await this.ctx.patch(`/offers/${offerId}/respond`, { data: { accept } })
    if (!res.ok()) throw new Error(`PATCH /offers/${offerId}/respond failed (${res.status()}): ${await res.text()}`)
    return (await res.json()) as { accepted: boolean }
  }

  async waitForOfferForRide(
    driverId: string,
    rideId: string,
    opts: { timeoutMs?: number; pollMs?: number } = {}
  ): Promise<RideOffer> {
    const timeoutMs = opts.timeoutMs ?? 30_000
    const pollMs = opts.pollMs ?? 1_000
    const deadline = Date.now() + timeoutMs
    let lastErr: unknown = null
    while (Date.now() < deadline) {
      try {
        const offers = await this.listDriverOffers(driverId)
        const match = offers.find((o) => o.rideRequest?.id === rideId && o.status === 'PENDING')
        if (match) return match
      } catch (err) {
        lastErr = err
      }
      await new Promise((r) => setTimeout(r, pollMs))
    }
    throw new Error(`Offer for ride ${rideId} not received by driver ${driverId} within ${timeoutMs}ms${lastErr ? ` (last error: ${String(lastErr)})` : ''}`)
  }

  async waitForRideStatus(
    rideId: string,
    predicate: (r: { status: string; selectedDriverId: string | null }) => boolean,
    opts: { timeoutMs?: number; pollMs?: number } = {}
  ): Promise<{ status: string; selectedDriverId: string | null }> {
    const timeoutMs = opts.timeoutMs ?? 30_000
    const pollMs = opts.pollMs ?? 1_000
    const deadline = Date.now() + timeoutMs
    let last: { status: string; selectedDriverId: string | null } | null = null
    while (Date.now() < deadline) {
      const ride = await this.getRide(rideId)
      last = { status: ride.status, selectedDriverId: ride.selectedDriverId }
      if (predicate(last)) return last
      await new Promise((r) => setTimeout(r, pollMs))
    }
    throw new Error(`Ride ${rideId} did not reach expected status within ${timeoutMs}ms (last: ${JSON.stringify(last)})`)
  }
}
