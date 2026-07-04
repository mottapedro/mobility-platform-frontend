'use client'

import { useEffect } from 'react'
import { API_URL } from '../config/api'

/* ─────────────────────────────────────────────────────────────────────────────
   WebMCPIntegration
   Injeta 10 tools no agente WebMCP (extensão Chrome).

   FIX: usa polling até window.WebMCP estar disponível.
   A extensão injeta o objeto de forma assíncrona — o useEffect do React
   pode disparar antes da injeção terminar. Polling resolve isso sem
   dependências externas.
─────────────────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    WebMCP: new (config: { color: string; position: string }) => {
      registerTool: (
        name: string,
        description: string,
        schema: Record<string, unknown>,
        handler: (args: Record<string, string>) => Promise<{ content: { type: string; text: string }[] }>
      ) => void
    }
  }
}

type MCPResult = { content: { type: 'text'; text: string }[] }

function ok(data: unknown): MCPResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

function err(msg: string): MCPResult {
  return { content: [{ type: 'text', text: `❌ Erro: ${msg}` }] }
}

function getAuth() {
  if (typeof window === 'undefined') return { token: null, driverId: null }
  return {
    token: localStorage.getItem('aliado:token'),
    driverId: localStorage.getItem('driverId'),
  }
}

function ngrokHeaders(token?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(API_URL?.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  }
}

async function apiCall(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token: string,
  body?: unknown
): Promise<MCPResult> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: ngrokHeaders(token),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const msg =
      (data as Record<string, string>)?.message ??
      (data as Record<string, string>)?.error ??
      res.statusText
    return err(`${res.status} — ${msg}`)
  }
  return ok(data)
}

function registerTools(mcp: InstanceType<typeof window.WebMCP>) {
  // ── 1. Diagnóstico ──────────────────────────────────────────────────────────
  mcp.registerTool(
    'diagnostico_api',
    'Verifica se a API está online e retorna o perfil do driver logado.',
    {},
    async () => {
      const { token, driverId } = getAuth()
      if (!token || !driverId) return err('Driver não autenticado. Faça login primeiro.')
      return apiCall('GET', `/drivers/${driverId}`, token)
    }
  )

  // ── 2. Perfil do driver ─────────────────────────────────────────────────────
  mcp.registerTool(
    'obter_perfil_driver',
    'Retorna o perfil completo do driver logado (nome, veículo, região, status).',
    {},
    async () => {
      const { token, driverId } = getAuth()
      if (!token || !driverId) return err('Driver não autenticado.')
      return apiCall('GET', `/drivers/${driverId}`, token)
    }
  )

  // ── 3. Listar ofertas ───────────────────────────────────────────────────────
  mcp.registerTool(
    'listar_ofertas',
    'Lista todas as ofertas de corrida disponíveis para o driver logado.',
    {},
    async () => {
      const { token, driverId } = getAuth()
      if (!token || !driverId) return err('Driver não autenticado.')
      return apiCall('GET', `/drivers/${driverId}/offers`, token)
    }
  )

  // ── 4. Aceitar oferta ───────────────────────────────────────────────────────
  mcp.registerTool(
    'aceitar_oferta',
    'Aceita uma oferta de corrida pelo ID.',
    { offer_id: { type: 'string', description: 'ID da oferta' } },
    async (args) => {
      const { token } = getAuth()
      if (!token) return err('Driver não autenticado.')
      if (!args.offer_id) return err('offer_id é obrigatório.')
      return apiCall('PATCH', `/offers/${args.offer_id}/respond`, token, { accept: true })
    }
  )

  // ── 5. Rejeitar oferta ──────────────────────────────────────────────────────
  mcp.registerTool(
    'rejeitar_oferta',
    'Rejeita uma oferta de corrida pelo ID.',
    { offer_id: { type: 'string', description: 'ID da oferta' } },
    async (args) => {
      const { token } = getAuth()
      if (!token) return err('Driver não autenticado.')
      if (!args.offer_id) return err('offer_id é obrigatório.')
      return apiCall('PATCH', `/offers/${args.offer_id}/respond`, token, { accept: false })
    }
  )

  // ── 6. Corridas do driver ───────────────────────────────────────────────────
  mcp.registerTool(
    'listar_corridas_driver',
    'Histórico de corridas do driver (aceitas, concluídas, rejeitadas).',
    {},
    async () => {
      const { token, driverId } = getAuth()
      if (!token || !driverId) return err('Driver não autenticado.')
      return apiCall('GET', `/drivers/${driverId}/rides`, token)
    }
  )

  // ── 7. Detalhes de corrida ──────────────────────────────────────────────────
  mcp.registerTool(
    'obter_corrida',
    'Retorna os detalhes completos de uma corrida pelo ID.',
    { ride_id: { type: 'string', description: 'ID da corrida' } },
    async (args) => {
      const { token } = getAuth()
      if (!token) return err('Driver não autenticado.')
      if (!args.ride_id) return err('ride_id é obrigatório.')
      return apiCall('GET', `/rides/${args.ride_id}`, token)
    }
  )

  // ── 8. Corridas pendentes ───────────────────────────────────────────────────
  mcp.registerTool(
    'listar_corridas_pendentes',
    'Lista todas as corridas com status pending no sistema.',
    {},
    async () => {
      const { token } = getAuth()
      if (!token) return err('Driver não autenticado.')
      return apiCall('GET', '/rides?status=pending', token)
    }
  )

  // ── 9. Rede do driver ───────────────────────────────────────────────────────
  mcp.registerTool(
    'obter_rede_driver',
    'Retorna a rede de indicações do driver (passageiros e motoristas).',
    {},
    async () => {
      const { token, driverId } = getAuth()
      if (!token || !driverId) return err('Driver não autenticado.')
      return apiCall('GET', `/drivers/${driverId}/network`, token)
    }
  )

  // ── 10. Testar matching engine ──────────────────────────────────────────────
  mcp.registerTool(
    'testar_matching_engine',
    'Cria corrida de teste para validar o roteamento do matching engine.',
    {
      origin:      { type: 'string', description: 'Endereço de origem' },
      destination: { type: 'string', description: 'Endereço de destino' },
      origin_lat:  { type: 'number', description: 'Latitude origem' },
      origin_lng:  { type: 'number', description: 'Longitude origem' },
      dest_lat:    { type: 'number', description: 'Latitude destino' },
      dest_lng:    { type: 'number', description: 'Longitude destino' },
    },
    async (args) => {
      const { token } = getAuth()
      if (!token) return err('Driver não autenticado.')
      let passengerId: string | null = null
      try {
        const auth = JSON.parse(localStorage.getItem('aliado:auth') ?? '{}')
        passengerId = auth?.passengerId ?? null
      } catch { /* ignore */ }

      return apiCall('POST', '/rides', token, {
        passengerId: passengerId ?? 'test-passenger',
        origin: args.origin ?? 'Rua Henrique Scheid, 235, Méier, Rio de Janeiro',
        destination: args.destination ?? 'Aeroporto Internacional Tom Jobim, Rio de Janeiro',
        originLat: parseFloat(args.origin_lat as unknown as string) || -22.9068,
        originLng: parseFloat(args.origin_lng as unknown as string) || -43.2682,
        destinationLat: parseFloat(args.dest_lat as unknown as string) || -22.8091,
        destinationLng: parseFloat(args.dest_lng as unknown as string) || -43.2503,
        scheduledAt: new Date().toISOString(),
        notes: '[TESTE WebMCP] Disparo de diagnóstico do matching engine.',
      })
    }
  )

  console.log(`[ALIADO WebMCP] ✅ 10 tools registradas. API: ${API_URL}`)
}

export function WebMCPIntegration() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Polling: aguarda até window.WebMCP estar disponível (extensão injeta async)
    const MAX_ATTEMPTS = 40   // 40 × 250ms = 10 segundos
    const INTERVAL_MS  = 250
    let attempts = 0
    let registered = false

    const timer = setInterval(() => {
      attempts++

      if ('WebMCP' in window && !registered) {
        registered = true
        clearInterval(timer)
        try {
          const mcp = new window.WebMCP({ color: '#F28C28', position: 'bottom-right' })
          registerTools(mcp)
        } catch (e) {
          console.warn('[ALIADO WebMCP] Erro ao registrar tools:', e)
        }
        return
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(timer)
        console.log('[ALIADO WebMCP] window.WebMCP não encontrado após 10s. Extensão instalada?')
      }
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  return null
}
