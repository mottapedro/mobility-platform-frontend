'use client'

import { useEffect } from 'react'
import { API_URL } from '../config/api'

/* ─────────────────────────────────────────────────────────────────────────────
   WebMCPIntegration
   Componente invisível que injeta tools no agente WebMCP (extensão de browser).
   Cada tool é um endpoint real da API do ALIADO, autenticado via token do
   localStorage — nenhuma credencial é hardcoded no bundle.

   Tools disponíveis:
     • diagnostico_api          — verifica se a API está respondendo
     • obter_perfil_driver      — GET /drivers/:id
     • listar_ofertas           — GET /drivers/:id/offers
     • aceitar_oferta           — PATCH /offers/:id/respond { accept: true }
     • rejeitar_oferta          — PATCH /offers/:id/respond { accept: false }
     • listar_corridas_driver   — GET /drivers/:id/rides
     • obter_corrida            — GET /rides/:id
     • listar_corridas_pendentes— GET /rides?status=pending
     • obter_rede_driver        — GET /drivers/:id/network
     • testar_matching_engine   — POST /rides (ride de teste completo)
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

function getAuth(): { token: string | null; driverId: string | null } {
  if (typeof window === 'undefined') return { token: null, driverId: null }
  return {
    token: localStorage.getItem('aliado:token'),
    driverId: localStorage.getItem('driverId'),
  }
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
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
    headers: authHeaders(token),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const msg = (data as Record<string, string>)?.message ?? (data as Record<string, string>)?.error ?? res.statusText
    return err(`${res.status} — ${msg}`)
  }
  return ok(data)
}

export function WebMCPIntegration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('WebMCP' in window)) return

    const mcp = new window.WebMCP({ color: '#F28C28', position: 'bottom-right' })

    // ── 1. Diagnóstico ────────────────────────────────────────────────────────
    mcp.registerTool(
      'diagnostico_api',
      'Verifica se a API do ALIADO está online e autentica o driver atual.',
      {},
      async () => {
        const { token, driverId } = getAuth()
        if (!token || !driverId) return err('Nenhum token encontrado. Faça login como driver primeiro.')
        return apiCall('GET', `/drivers/${driverId}`, token)
      }
    )

    // ── 2. Perfil do driver ───────────────────────────────────────────────────
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

    // ── 3. Listar ofertas ─────────────────────────────────────────────────────
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

    // ── 4. Aceitar oferta ─────────────────────────────────────────────────────
    mcp.registerTool(
      'aceitar_oferta',
      'Aceita uma oferta de corrida pelo ID da oferta.',
      { offer_id: { type: 'string', description: 'ID da oferta a aceitar' } },
      async (args) => {
        const { token } = getAuth()
        if (!token) return err('Driver não autenticado.')
        if (!args.offer_id) return err('offer_id é obrigatório.')
        return apiCall('PATCH', `/offers/${args.offer_id}/respond`, token, { accept: true })
      }
    )

    // ── 5. Rejeitar oferta ────────────────────────────────────────────────────
    mcp.registerTool(
      'rejeitar_oferta',
      'Rejeita uma oferta de corrida pelo ID da oferta.',
      { offer_id: { type: 'string', description: 'ID da oferta a rejeitar' } },
      async (args) => {
        const { token } = getAuth()
        if (!token) return err('Driver não autenticado.')
        if (!args.offer_id) return err('offer_id é obrigatório.')
        return apiCall('PATCH', `/offers/${args.offer_id}/respond`, token, { accept: false })
      }
    )

    // ── 6. Corridas do driver ─────────────────────────────────────────────────
    mcp.registerTool(
      'listar_corridas_driver',
      'Lista o histórico de corridas do driver logado (aceitas, concluídas, rejeitadas).',
      {},
      async () => {
        const { token, driverId } = getAuth()
        if (!token || !driverId) return err('Driver não autenticado.')
        return apiCall('GET', `/drivers/${driverId}/rides`, token)
      }
    )

    // ── 7. Detalhes de corrida ────────────────────────────────────────────────
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

    // ── 8. Corridas pendentes ─────────────────────────────────────────────────
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

    // ── 9. Rede do driver ─────────────────────────────────────────────────────
    mcp.registerTool(
      'obter_rede_driver',
      'Retorna a rede de indicações do driver (passageiros e motoristas indicados).',
      {},
      async () => {
        const { token, driverId } = getAuth()
        if (!token || !driverId) return err('Driver não autenticado.')
        return apiCall('GET', `/drivers/${driverId}/network`, token)
      }
    )

    // ── 10. Testar matching engine ────────────────────────────────────────────
    mcp.registerTool(
      'testar_matching_engine',
      'Cria uma corrida de teste para validar o roteamento do matching engine. Requer origem e destino no Rio de Janeiro.',
      {
        origin:      { type: 'string',  description: 'Endereço de origem (ex: Rua Henrique Scheid, 235, Méier, Rio de Janeiro)' },
        destination: { type: 'string',  description: 'Endereço de destino (ex: Aeroporto do Galeão, Rio de Janeiro)' },
        origin_lat:  { type: 'number',  description: 'Latitude da origem (ex: -22.9068)' },
        origin_lng:  { type: 'number',  description: 'Longitude da origem (ex: -43.2682)' },
        dest_lat:    { type: 'number',  description: 'Latitude do destino (ex: -22.8091)' },
        dest_lng:    { type: 'number',  description: 'Longitude do destino (ex: -43.2503)' },
      },
      async (args) => {
        const { token } = getAuth()
        if (!token) return err('Driver não autenticado.')
        const authData = localStorage.getItem('aliado:auth')
        let passengerId: string | null = null
        try {
          const parsed = JSON.parse(authData ?? '{}')
          passengerId = parsed?.passengerId ?? null
        } catch { /* ignore */ }

        const payload = {
          passengerId:      passengerId ?? 'test-passenger',
          origin:           args.origin ?? 'Rua Henrique Scheid, 235, Méier, Rio de Janeiro',
          destination:      args.destination ?? 'Aeroporto Internacional Tom Jobim, Rio de Janeiro',
          originLat:        parseFloat(args.origin_lat as unknown as string) || -22.9068,
          originLng:        parseFloat(args.origin_lng as unknown as string) || -43.2682,
          destinationLat:   parseFloat(args.dest_lat as unknown as string) || -22.8091,
          destinationLng:   parseFloat(args.dest_lng as unknown as string) || -43.2503,
          scheduledAt:      new Date().toISOString(),
          notes:            '[TESTE WebMCP] Disparo de diagnóstico do matching engine.',
        }

        return apiCall('POST', '/rides', token, payload)
      }
    )

    console.log('[ALIADO WebMCP] 10 tools registradas. API:', API_URL)
  }, [])

  return null
}
