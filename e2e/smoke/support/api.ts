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
  token: string
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
    const ctx = await pwRequest.newContext({
      baseURL: baseUrl,
      // Bypass ngrok's browser-warning HTML interstitial on free-plan tunnels.
      extraHTTPHeaders: { 'ngrok-skip-browser-warning': 'any' },
    })
    return new SmokeApi(ctx, baseUrl)
  }

  async dispose() {
    await this.ctx.dispose()
  }

  /**
   * Low-level GET returning raw JSON. For contract/shape assertions that need
   * access to fields not yet surfaced on typed helpers.
   */
  async rawGet(
    path: string,
    params?: Record<string, string>,
    extraHeaders?: Record<string, string>,
  ): Promise<unknown> {
    const res = await this.ctx.get(path, { params, headers: extraHeaders })
    if (!res.ok()) throw new Error(`GET ${path} failed (${res.status()}): ${await res.text()}`)
    return res.json()
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

  async createRide(
    input: { 
      passengerId?: string; 
      origin: string; 
      destination: string; 
      scheduledAt: string;
      originLat?: number;
      originLng?: number;
      destinationLat?: number;
      destinationLng?: number;
    },
    token?: string,
  ): Promise<{ id: string; status: string }> {
    const res = await this.ctx.post('/rides', {
      data: {
        passengerId: input.passengerId,
        origin: input.origin,
        destination: input.destination,
        scheduledAt: input.scheduledAt,
        ...(input.originLat != null && input.originLng != null ? { originLat: input.originLat, originLng: input.originLng } : {}),
        ...(input.destinationLat != null && input.destinationLng != null ? { destinationLat: input.destinationLat, destinationLng: input.destinationLng } : {}),
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (res.status() !== 201 && res.status() !== 200) {
      throw new Error(`POST /rides failed (${res.status()}): ${await res.text()}`)
    }
    // Backend wraps the ride in { message, ride: { ... } }; fall back to bare body.
    const body = (await res.json()) as Record<string, unknown>
    return ((body['ride'] as Record<string, unknown>) ?? body) as { id: string; status: string }
  }

  async getRide(rideId: string): Promise<{ id: string; status: string; selectedDriverId: string | null }> {
    const res = await this.ctx.get(`/rides/${rideId}`)
    if (!res.ok()) throw new Error(`GET /rides/${rideId} failed (${res.status()})`)
    return (await res.json()) as { id: string; status: string; selectedDriverId: string | null }
  }

  /**
   * Returns the ride with the full offers array (PENDING/ACCEPTED/REJECTED/EXPIRED).
   * Used by dispatch-invariant smoke to assert "at most one PENDING offer at a time".
   */
  async getRideWithOffers(rideId: string): Promise<{
    id: string
    status: string
    selectedDriverId: string | null
    offers: Array<{ id: string; driverId: string; status: string; expiresAt: string }>
  }> {
    const res = await this.ctx.get(`/rides/${rideId}`)
    if (!res.ok()) throw new Error(`GET /rides/${rideId} failed (${res.status()})`)
    return (await res.json()) as {
      id: string
      status: string
      selectedDriverId: string | null
      offers: Array<{ id: string; driverId: string; status: string; expiresAt: string }>
    }
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

  /**
   * Best-effort ride cancellation. Silently ignores all errors.
   * Used in afterAll hooks to clean up test-created rides and avoid
   * SCHEDULE_CONFLICT (409) in subsequent runs.
   */
  /**
   * Best-effort ride cancellation. Silently ignores all errors.
   * Pass the passenger's bearer token so the backend can authorize the request.
   */
  async tryCancel(rideId: string, token?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      await this.ctx.delete(`/rides/${rideId}`, { headers })
    } catch {
      // Best-effort; ignore endpoint not supported or ride already terminal.
    }
  }

  /**
   * Create a ride, automatically resolving SCHEDULE_CONFLICT (409) by
   * cancelling the conflicting ride and retrying. Handles the accumulated
   * stale rides left by previous test runs without manual cleanup.
   */
  async createRideOrReclaim(
    input: {
      passengerId: string
      origin: string
      destination: string
      scheduledAt: string
      originLat?: number
      originLng?: number
      destinationLat?: number
      destinationLng?: number
    },
    token: string,
    maxAttempts = 8,
  ): Promise<{ id: string; status: string; [k: string]: unknown }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.createRide(input, token)
      } catch (err: unknown) {
        const msg = String(err)
        const m = msg.match(/"conflictingRideId":"([a-f0-9-]+)"/)
        if (m && attempt < maxAttempts - 1) {
          console.log(
            `[createRideOrReclaim] 409 conflict with ${m[1]}, cancelling and retrying (attempt ${attempt + 1}/${maxAttempts})`,
          )
          await this.tryCancel(m[1], token)
          // Brief pause for the backend to process the cancellation.
          await new Promise((r) => setTimeout(r, 800))
          continue
        }
        throw err
      }
    }
    throw new Error('createRideOrReclaim: all attempts exhausted')
  }
}
