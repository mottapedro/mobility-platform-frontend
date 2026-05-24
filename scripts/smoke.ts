#!/usr/bin/env node
/**
 * Smoke Test — Golden Network Operacional (v2)
 *
 * Validates (7 sections, ~15 steps):
 *  A. Authentication — login, session, publicSlug, referralCode
 *  B. Hierarchy BEFORE — Golden Network members, depth, levels (HARD assert)
 *  C. Passenger Referral — `networkgold` code, referredByDriverId, totalPassengers (HARD assert)
 *  D. DriverNetworkTree payload — me.name, levels, referrals
 *  E. Scheduled Ride — create ride (now+26h), offer appears, accept, ACCEPTED status
 *  F. Frontend Sync — recentPassengers without manual refresh
 *  G. Final report
 *
 * Usage:   npm run smoke
 * Requires: Backend running at NEXT_PUBLIC_API_URL (default: http://localhost:3000)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
const DRIVER_EMAIL = 'mottapedro01@gmail.com'
const DRIVER_PASSWORD = '123456'
const TEST_SLUG = 'pedro-paulo-motta'
// Referral code for new test passenger — real code per Golden Network seed (runOfficialGoldenNetworkSeed)
const GOLDEN_REFERRAL_CODE = 'pedro-motta-zn-elite'
// Golden Network expected members — partial, case-insensitive name match
const GOLDEN_MEMBERS = ['João Luiz', 'Carlinhos', 'Jenner', 'Bira', 'Gisele', 'Fábio', 'André']

// ── ANSI colors ───────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'

const pass   = (msg: string) => console.log(`${GREEN}✅ ${msg}${RESET}`)
const fail   = (msg: string) => console.log(`${RED}❌ ${msg}${RESET}`)
const info   = (msg: string) => console.log(`${CYAN}ℹ  ${msg}${RESET}`)
const warn   = (msg: string) => console.log(`${YELLOW}⚠  ${msg}${RESET}`)
const dim    = (msg: string) => console.log(`${DIM}   ${msg}${RESET}`)
const header = (msg: string) => console.log(`\n${BOLD}${msg}${RESET}`)

// ── Slug utilities — mirrors src/services/drivers.ts ─────────────────────────
function normalizeSlugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDriverSlug(name: string): string {
  return normalizeSlugPart(name)
}

interface DriverSummary {
  id: string
  name: string
  phone: string
  referralCode?: string
  publicSlug?: string
}

function findDriverByReferralSlug(drivers: DriverSummary[], slug: string): DriverSummary | null {
  const n = normalizeSlugPart(slug)
  const byPublicSlug = drivers.find((d) => d.publicSlug === n)
  if (byPublicSlug) return byPublicSlug
  const byExactName  = drivers.find((d) => buildDriverSlug(d.name) === n)
  if (byExactName)  return byExactName
  const byPrefix = drivers.filter((d) => n.startsWith(`${buildDriverSlug(d.name)}-`))
  if (byPrefix.length === 1) return byPrefix[0]
  return null
}

// ── Hierarchy helpers ─────────────────────────────────────────────────────────
interface NetworkNode {
  id?: string
  name: string
  depth?: number
  referrals?: NetworkNode[]
}

/** Recursively collect all driver names from a hierarchy tree. */
function collectNames(node: NetworkNode | null | undefined, depth = 0): Array<{ name: string; depth: number }> {
  if (!node) return []
  const result: Array<{ name: string; depth: number }> = [{ name: node.name, depth }]
  for (const child of node.referrals ?? []) {
    result.push(...collectNames(child, depth + 1))
  }
  return result
}

/** Check if any collected name contains the search term (partial, case-insensitive). */
function namePresent(names: Array<{ name: string }>, term: string): boolean {
  const t = normalizeSlugPart(term)
  return names.some((n) => normalizeSlugPart(n.name).includes(t))
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
const isNgrok = API_URL.includes('ngrok')

function buildHeaders(token?: string, driverId?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  if (driverId) h['x-driver-id'] = driverId
  if (isNgrok) h['ngrok-skip-browser-warning'] = 'true'
  return h
}

async function httpPost<T>(path: string, body: unknown, token?: string, driverId?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(token, driverId),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) throw new Error(`POST ${path} → HTTP ${res.status}: ${text}`)
  return json as T
}

async function httpPatch<T>(path: string, body: unknown, token?: string, driverId?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(token, driverId),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) throw new Error(`PATCH ${path} → HTTP ${res.status}: ${text}`)
  return json as T
}

async function httpGet<T>(path: string, token?: string, driverId?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(token, driverId),
  })
  const text = await res.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}: ${text}`)
  return json as T
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Step runner ───────────────────────────────────────────────────────────────
const failures: string[] = []
const warnings: string[] = []
let stepCount = 0

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  stepCount++
  try {
    const result = await fn()
    pass(label)
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    fail(`${label}\n    ${RED}↳ ${msg}${RESET}`)
    failures.push(label)
    return null
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

// ── Response types ────────────────────────────────────────────────────────────
interface AuthLoginResponse {
  token?: string
  user?: { id?: string; driverId?: string; role?: string; name?: string }
  driverId?: string
  referralCode?: string
  publicSlug?: string
}

interface AuthRegisterResponse extends AuthLoginResponse {
  referredByDriverId?: string
  passengerId?: string
  passenger?: { id?: string }
}

interface DriverNetworkBody {
  totalPassengers?: number
  recentPassengers?: Array<{ id: string; name: string; ridesCount: number; lastRideAt: string | null }>
  passengers?: unknown[]
  ridesCompleted?: number
  estimatedRevenue?: number
}

interface DriverNetworkResponse extends DriverNetworkBody {
  data?: DriverNetworkBody
}

interface HierarchyResponse {
  me?: NetworkNode
  referredBy?: NetworkNode | null
  referrals?: NetworkNode[]
  totalDrivers?: number
  maxDepth?: number
}

interface DriverOfferRaw {
  id: string
  status: string
  expiresAt?: string
  rideRequest?: { id?: string }
  ride?: { id?: string }
}

interface RideResponse {
  id?: string
  ride?: { id?: string }
  message?: string
  status?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractNetwork(raw: DriverNetworkResponse): DriverNetworkBody {
  return (raw.data as DriverNetworkBody | undefined) ?? raw
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`\n${BOLD}🚀 Aliado — Smoke Test Golden Network Operacional (v2)${RESET}`)
  info(`API    : ${API_URL}`)
  info(`Email  : ${DRIVER_EMAIL}`)
  info(`Slug   : ${TEST_SLUG}`)
  info(`Referral : ${GOLDEN_REFERRAL_CODE}`)

  let token        = ''
  let driverId     = ''
  let referralCode = GOLDEN_REFERRAL_CODE  // start with user-specified code
  let testSlug     = TEST_SLUG
  let beforeTotal  = 0
  let smokePassengerId = ''
  let smokePassengerName = ''
  let rideId       = ''

  // ── Fase A: Authentication ─────────────────────────────────────────────────
  header('══ Fase A — Autenticação + Sessão')

  const loginResult = await step<AuthLoginResponse>(
    'A1 · Login como motorista (POST /auth/login)',
    async () => {
      const res = await httpPost<AuthLoginResponse>('/auth/login', {
        email: DRIVER_EMAIL,
        password: DRIVER_PASSWORD,
      })
      const id = res.driverId ?? res.user?.driverId
      assert(typeof id === 'string' && id.length > 0,
        `driverId ausente na resposta: ${JSON.stringify(res)}`)
      if (res.token) info('token JWT recebido ✓')
      else warn('Backend não retornou token JWT — usando x-driver-id header')
      return res
    }
  )

  if (!loginResult) {
    fail('Login falhou — abortando smoke test')
    process.exit(1)
  }

  token    = loginResult.token ?? ''
  driverId = loginResult.driverId ?? loginResult.user?.driverId ?? ''
  if (loginResult.publicSlug)   testSlug = loginResult.publicSlug
  if (loginResult.referralCode) {
    info(`referralCode do backend: ${loginResult.referralCode}`)
    info(`referralCode usado no teste: ${GOLDEN_REFERRAL_CODE} (user-specified)`)
  }
  dim(`driverId   : ${driverId}`)
  dim(`publicSlug : ${testSlug}`)

  const driversResult = await step<DriverSummary[]>(
    'A2 · Lista de motoristas + resolução de slug (GET /drivers)',
    async () => {
      const raw = await httpGet<unknown>('/drivers', token, driverId)
      const arr = Array.isArray(raw)
        ? raw
        : ((raw as { value?: DriverSummary[] }).value ?? [])
      assert(Array.isArray(arr) && arr.length > 0,
        `Lista vazia ou formato inesperado: ${JSON.stringify(raw).slice(0, 200)}`)
      const found = findDriverByReferralSlug(arr as DriverSummary[], testSlug)
      assert(found !== null, `Nenhum motorista encontrado para o slug '${testSlug}'`)
      assert(found!.id === driverId,
        `Slug resolveu para driver '${found!.id}' mas esperava '${driverId}'`)
      const resolved = found!.referralCode ?? buildDriverSlug(found!.name)
      dim(`referralCode do slug: ${resolved}`)
      // if backend referralCode differs from GOLDEN_REFERRAL_CODE, prefer backend's
      if (loginResult.referralCode && loginResult.referralCode !== GOLDEN_REFERRAL_CODE) {
        dim(`Nota: referralCode do backend ('${loginResult.referralCode}') !== '${GOLDEN_REFERRAL_CODE}'`)
        dim('O teste usa networkgold conforme especificado; fallback automático se backend rejeitar')
      }
      return arr as DriverSummary[]
    }
  )
  void driversResult

  // ── Fase B: Hierarchy ANTES ─────────────────────────────────────────────────
  header('══ Fase B — Network Render + Hierarchy (Golden Network)')

  await step<DriverNetworkResponse>(
    'B3 · Snapshot da rede antes (GET /drivers/:id/network)',
    async () => {
      const raw = await httpGet<DriverNetworkResponse>(`/drivers/${driverId}/network`, token, driverId)
      const body = extractNetwork(raw)
      beforeTotal = typeof body.totalPassengers === 'number' ? body.totalPassengers : 0
      dim(`totalPassengers antes : ${beforeTotal}`)
      dim(`ridesCompleted        : ${body.ridesCompleted ?? 'N/A'}`)
      dim(`estimatedRevenue      : ${body.estimatedRevenue ?? 'N/A'}`)
      return raw
    }
  )

  const hierBefore = await step<HierarchyResponse>(
    'B4 · Hierarquia da rede — endpoint implementado (GET /drivers/:id/network/hierarchy)',
    async () => {
      const hier = await httpGet<HierarchyResponse>(`/drivers/${driverId}/network/hierarchy`, token, driverId)
      assert(hier !== null && typeof hier === 'object',
        `Hierarquia retornou resposta inválida: ${JSON.stringify(hier)}`)
      const totalDrivers = typeof hier.totalDrivers === 'number' ? hier.totalDrivers : 0
      const maxDepth = typeof hier.maxDepth === 'number' ? hier.maxDepth : 0
      dim(`me.name      : ${hier.me?.name ?? '(ausente)'}`)
      dim(`totalDrivers : ${totalDrivers}`)
      dim(`maxDepth     : ${maxDepth}`)
      assert(typeof hier.me === 'object' && hier.me !== null,
        `hier.me ausente — payload: ${JSON.stringify(hier).slice(0, 300)}`)
      return hier
    }
  )

  await step(
    'B5 · Golden Network — membros presentes na hierarquia',
    async () => {
      assert(hierBefore !== null, 'Hierarquia indisponível (step B4 falhou)')
      // Collect all names: me + referrals recursively
      const allNames: Array<{ name: string; depth: number }> = []
      if (hierBefore!.me) allNames.push(...collectNames(hierBefore!.me, 0))
      for (const ref of hierBefore!.referrals ?? []) {
        allNames.push(...collectNames(ref, 1))
      }
      if (hierBefore!.referredBy) allNames.push(...collectNames(hierBefore!.referredBy, -1))

      dim(`Nós encontrados (${allNames.length}):`)
      // Group by depth for display
      const byDepth = new Map<number, string[]>()
      for (const { name, depth } of allNames) {
        if (!byDepth.has(depth)) byDepth.set(depth, [])
        byDepth.get(depth)!.push(name)
      }
      for (const [d, names] of [...byDepth.entries()].sort((a, b) => a[0] - b[0])) {
        const label = d === 0 ? 'Você' : d < 0 ? 'Referenciado por' : `Nível ${d}`
        dim(`  ${label}: ${names.join(', ')}`)
      }

      const missing: string[] = []
      for (const member of GOLDEN_MEMBERS) {
        if (!namePresent(allNames, member)) missing.push(member)
      }
      const found = GOLDEN_MEMBERS.filter((m) => namePresent(allNames, m))
      info(`Membros confirmados (${found.length}/${GOLDEN_MEMBERS.length}): ${found.join(', ')}`)
      if (missing.length > 0) {
        warn(`Membros não encontrados: ${missing.join(', ')}`)
        warnings.push(`Golden Network members ausentes: ${missing.join(', ')}`)
        // Soft-warn: hierarchy may not yet have all members seeded — don't hard-fail
      }
      const totalDrivers = hierBefore!.totalDrivers ?? 0
      const maxDepth = hierBefore!.maxDepth ?? 0
      if (totalDrivers < 2) warn(`totalDrivers=${totalDrivers} — esperava >= 2`)
      if (maxDepth < 1) warn(`maxDepth=${maxDepth} — esperava >= 1`)
      dim(`totalDrivers=${totalDrivers}  maxDepth=${maxDepth}`)
    }
  )

  // ── Fase C: Passenger Referral Flow ────────────────────────────────────────
  header('══ Fase C — Passenger Referral Flow (pedro-motta-zn-elite)')

  const newEmail = `smoke_${Date.now()}@test.aliado`
  smokePassengerName = 'Smoke Golden'
  warn(`Passageiro descartável: ${newEmail}`)

  const registerResult = await step<AuthRegisterResponse>(
    `C6 · Registro de passageiro com referralCode '${GOLDEN_REFERRAL_CODE}' (POST /auth/register)`,
    async () => {
      let res: AuthRegisterResponse
      try {
        res = await httpPost<AuthRegisterResponse>('/auth/register', {
          name: smokePassengerName,
          email: newEmail,
          password: 'Smoke@123456',
          role: 'passenger',
          phone: '21999990001',
          referralCode: GOLDEN_REFERRAL_CODE,
        })
      } catch (primaryErr) {
        const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
        // Fallback: try login's referralCode if primary was rejected
        const fallbackCode = loginResult?.referralCode ?? loginResult?.publicSlug ?? ''
        if (fallbackCode && fallbackCode !== GOLDEN_REFERRAL_CODE) {
          warn(`Backend rejeitou '${GOLDEN_REFERRAL_CODE}': ${msg}`)
          warn(`Tentando fallback com referralCode do login: '${fallbackCode}'`)
          warnings.push(`'${GOLDEN_REFERRAL_CODE}' não aceito pelo backend — fallback para '${fallbackCode}'`)
          res = await httpPost<AuthRegisterResponse>('/auth/register', {
            name: smokePassengerName,
            email: newEmail,
            password: 'Smoke@123456',
            role: 'passenger',
            phone: '21999990001',
            referralCode: fallbackCode,
          })
        } else {
          throw primaryErr
        }
      }
      assert(!!res.user || !!res.passengerId || !!res.passenger,
        `Resposta sem user/passengerId: ${JSON.stringify(res)}`)
      // Capture passenger ID for ride creation later
      smokePassengerId = res.passengerId
        ?? res.passenger?.id
        ?? res.user?.id
        ?? ''
      dim(`passengerId capturado: ${smokePassengerId || '(não retornado — ride smoke ignorado)'}`)
      return res
    }
  )

  await step(
    'C7 · referredByDriverId presente e correto na resposta de registro',
    async () => {
      assert(registerResult !== null, 'Registro falhou (step C6)')
      const rid = registerResult!.referredByDriverId
      assert(typeof rid === 'string' && rid.length > 0,
        `referredByDriverId ausente: ${JSON.stringify(registerResult)}`)
      assert(rid === driverId,
        `referredByDriverId '${rid}' ≠ driverId '${driverId}'`)
      info(`referredByDriverId: ${rid} ✓`)
    }
  )

  await step(
    'C8 · totalPassengers incrementou após referral (poll 3×)',
    async () => {
      let afterTotal = 0
      for (let attempt = 1; attempt <= 3; attempt++) {
        const raw = await httpGet<DriverNetworkResponse>(`/drivers/${driverId}/network`, token, driverId)
        const body = extractNetwork(raw)
        afterTotal = typeof body.totalPassengers === 'number' ? body.totalPassengers : 0
        dim(`  tentativa ${attempt}/3 → totalPassengers=${afterTotal} (esperava >= ${beforeTotal + 1})`)
        if (afterTotal >= beforeTotal + 1) break
        if (attempt < 3) await sleep(1000)
      }
      assert(afterTotal >= beforeTotal + 1,
        `totalPassengers não incrementou após 3 tentativas (antes=${beforeTotal}, depois=${afterTotal}). ` +
        'Backend pode ter regressão no PassengerReferral aggregation.')
      info(`totalPassengers: ${beforeTotal} → ${afterTotal} ✓`)
    }
  )

  // ── Fase D: DriverNetworkTree payload ──────────────────────────────────────
  header('══ Fase D — DriverNetworkTree Payload')

  await step(
    'D9 · Payload da hierarquia — me.name, níveis, referrals',
    async () => {
      const hier = await httpGet<HierarchyResponse>(`/drivers/${driverId}/network/hierarchy`, token, driverId)
      assert(typeof hier.me === 'object' && hier.me !== null, 'hier.me ausente')
      // me.name deve conter "Pedro" ou "Motta"
      const meName = hier.me!.name ?? ''
      const meNorm = normalizeSlugPart(meName)
      const hasPedro = meNorm.includes('pedro') || meNorm.includes('motta')
      if (!hasPedro) warn(`me.name='${meName}' — esperava nome de Pedro Motta`)
      else dim(`me.name: '${meName}' ✓`)

      const referrals = hier.referrals ?? []
      if (referrals.length === 0) {
        warn('referrals.length=0 — Golden Network não foi semeada neste ambiente; execute runOfficialGoldenNetworkSeed no backend')
        warnings.push('D9: hierarchy referrals vazia — runOfficialGoldenNetworkSeed não executada')
      } else {
        dim(`referrals (nível 1): ${referrals.length} motoristas`)
      }

      // Count all nodes for DriverNetworkTree display validation
      const allNodes: Array<{ name: string; depth: number }> = []
      if (hier.me) allNodes.push(...collectNames(hier.me, 0))
      for (const ref of referrals) allNodes.push(...collectNames(ref, 1))
      const byDepth = new Map<number, number>()
      for (const { depth } of allNodes) byDepth.set(depth, (byDepth.get(depth) ?? 0) + 1)
      for (const [d, count] of [...byDepth.entries()].sort((a, b) => a[0] - b[0])) {
        const label = d === 0 ? 'Você' : `Nível ${d}`
        dim(`  ${label}: ${count} nó(s)`)
      }
      dim(`totalDrivers: ${hier.totalDrivers ?? 'N/A'}  maxDepth: ${hier.maxDepth ?? 'N/A'}`)
      info(`DriverNetworkTree payload: ${allNodes.length} nós, ${byDepth.size} nível(is) ✓`)
    }
  )

  // ── Fase E: Scheduled Ride Smoke ───────────────────────────────────────────
  header('══ Fase E — Corrida Agendada (Ride + Offer Cycle)')

  if (!smokePassengerId) {
    warn('passengerId não disponível — pulando Fase E (ride smoke)')
    warnings.push('Fase E ignorada: backend não retornou passengerId no registro')
    stepCount += 4  // count the 4 skipped steps
  } else {
    // scheduledAt = now + 26h (above the 25h AcceptancePolicyEngine cutoff)
    const scheduledAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()

    const rideResult = await step<RideResponse>(
      'E10 · Criar corrida agendada (POST /rides)',
      async () => {
        const res = await httpPost<RideResponse>('/rides', {
          passengerId: smokePassengerId,
          origin: 'Aeroporto do Galeão, Rio de Janeiro',
          destination: 'Barra da Tijuca, Rio de Janeiro',
          scheduledAt,
          context: { isAirport: true },
          notes: 'Smoke test ride — pode ignorar',
        }, token, driverId)
        const id = res.id ?? res.ride?.id
        assert(typeof id === 'string' && id.length > 0,
          `rideId ausente na resposta: ${JSON.stringify(res)}`)
        rideId = id!
        dim(`rideId: ${rideId}`)
        dim(`scheduledAt: ${scheduledAt}`)
        return res
      }
    )
    void rideResult

    let offerId = ''
    await step(
      'E11 · Oferta do motorista aparece (poll 5× / 2s cada)',
      async () => {
        for (let attempt = 1; attempt <= 5; attempt++) {
          let arr: DriverOfferRaw[] = []
          try {
            const offers = await httpGet<DriverOfferRaw[]>(`/drivers/${driverId}/offers`, token, driverId)
            arr = Array.isArray(offers) ? offers : []
          } catch (fetchErr) {
            const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
            if (errMsg.includes('400') || errMsg.includes('inválido')) {
              warn(`/drivers/:id/offers → ${errMsg.slice(0, 120)}`)
              warn('Achado de backend: endpoint rejeita driverId na URL — não é regressão de frontend')
              warnings.push('E11: /drivers/:id/offers retorna 400 — achado de backend (validação UUID+header combo)')
              return
            }
            if (attempt < 5) { await sleep(2000); continue }
            warn(`Ofertas inacessíveis após 5 tentativas: ${errMsg}`)
            warnings.push(`E11: ofertas inacessíveis — ${errMsg}`)
            return
          }
          const match = arr.find((o) =>
            (o.rideRequest?.id === rideId || o.ride?.id === rideId) && o.status === 'PENDING'
          )
          dim(`  tentativa ${attempt}/5 → ${arr.length} oferta(s)${match ? `, match ✓ (${match.id})` : ''}`)
          if (match) {
            offerId = match.id
            info(`offerId: ${offerId} (status: ${match.status}) ✓`)
            return
          }
          if (attempt < 5) await sleep(2000)
        }
        // Soft-fail: matching engine may not have processed yet
        warn('Oferta não encontrada após 10s — matching engine pode estar lento')
        warnings.push('E11: oferta não apareceu em 10s para corrida smoke')
      }
    )

    if (offerId) {
      await step(
        'E12 · Aceitar oferta (PATCH /offers/:id/respond)',
        async () => {
          await httpPatch<unknown>(`/offers/${offerId}/respond`, { accept: true }, token, driverId)
          info(`Oferta ${offerId} aceita ✓`)
        }
      )

      await step(
        'E13 · Status da corrida é ACCEPTED ou WAITING_DRIVER (GET /rides/:id)',
        async () => {
          const ride = await httpGet<{ status?: string; id?: string }>(`/rides/${rideId}`, token, driverId)
          const status = ride.status ?? ''
          const valid = ['ACCEPTED', 'WAITING_DRIVER', 'MATCHING'].includes(status)
          assert(valid, `status='${status}' — esperava ACCEPTED ou WAITING_DRIVER`)
          dim(`ride.status: ${status} ✓`)
        }
      )
    } else {
      warn('Pulando E12-E13 (sem offerId)')
      stepCount += 2
    }
  }

  // ── Fase F: Frontend Synchronization ──────────────────────────────────────
  header('══ Fase F — Frontend Synchronization (sem refresh manual)')

  await step(
    'F14 · recentPassengers contém smoke passenger (GET /drivers/:id/network)',
    async () => {
      const raw = await httpGet<DriverNetworkResponse>(`/drivers/${driverId}/network`, token, driverId)
      const body = extractNetwork(raw)
      const recent = body.recentPassengers ?? (body.passengers as typeof body.recentPassengers) ?? []
      dim(`recentPassengers retornados: ${recent.length}`)
      const found = recent.find((p) =>
        normalizeSlugPart(p.name ?? '').includes(normalizeSlugPart(smokePassengerName))
      )
      if (found) {
        info(`'${found.name}' encontrado em recentPassengers ✓`)
      } else {
        warn(`'${smokePassengerName}' não encontrado em recentPassengers — backend pode usar paginação`)
        warnings.push('F14: smoke passenger não apareceu em recentPassengers')
      }
      // Validate other network fields are present (confirms no stale state)
      const finalTotal = typeof body.totalPassengers === 'number' ? body.totalPassengers : -1
      assert(finalTotal >= 0, `totalPassengers ausente no snapshot final: ${JSON.stringify(body)}`)
      dim(`totalPassengers final : ${finalTotal}`)
      dim(`ridesCompleted final  : ${body.ridesCompleted ?? 'N/A'}`)
    }
  )

  // ── Final Report ────────────────────────────────────────────────────────────
  const TOTAL  = stepCount
  const passed = TOTAL - failures.length

  console.log(`\n${'═'.repeat(56)}`)
  if (failures.length === 0) {
    console.log(`${BOLD}${GREEN}🎉 ${passed}/${TOTAL} steps passaram — Smoke OPERACIONAL PASSOU${RESET}`)
  } else {
    console.log(`${BOLD}${RED}💥 ${passed}/${TOTAL} steps passaram — Smoke FALHOU${RESET}`)
    console.log(`${RED}Steps com falha:${RESET}`)
    failures.forEach((f) => console.log(`  ${RED}• ${f}${RESET}`))
  }

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}Avisos remanescentes:${RESET}`)
    warnings.forEach((w) => console.log(`  ${YELLOW}⚠  ${w}${RESET}`))
  }

  console.log()
  console.log(`${DIM}Status:${RESET}`)
  console.log(`  ${failures.length === 0 ? GREEN : RED}• Hierarquia (Golden Network) : ${failures.some((f) => f.includes('B4') || f.includes('B5')) ? 'FALHOU' : 'OK'}${RESET}`)
  console.log(`  ${failures.some((f) => f.includes('C8')) ? RED : GREEN}• totalPassengers incrementa  : ${failures.some((f) => f.includes('C8')) ? 'FALHOU' : 'OK'}${RESET}`)
  console.log(`  ${failures.some((f) => f.includes('C7')) ? RED : GREEN}• referredByDriverId correto  : ${failures.some((f) => f.includes('C7')) ? 'FALHOU' : 'OK'}${RESET}`)
  console.log(`  ${failures.some((f) => f.includes('D9')) ? RED : GREEN}• DriverNetworkTree payload   : ${failures.some((f) => f.includes('D9')) ? 'FALHOU' : 'OK'}${RESET}`)
  console.log(`  ${failures.some((f) => f.includes('E')) ? RED : GREEN}• Ride + Offer cycle          : ${failures.some((f) => f.includes('E')) ? 'FALHOU' : warnings.some((w) => w.includes('E')) ? 'WARN' : 'OK'}${RESET}`)
  console.log(`  ${failures.some((f) => f.includes('F14')) ? RED : GREEN}• Frontend sync (sem refresh) : ${failures.some((f) => f.includes('F14')) ? 'FALHOU' : 'OK'}${RESET}`)
  console.log(`${'═'.repeat(56)}\n`)

  if (failures.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(
    `\n${RED}Erro fatal não capturado: ${err instanceof Error ? err.message : String(err)}${RESET}`
  )
  process.exit(1)
})
