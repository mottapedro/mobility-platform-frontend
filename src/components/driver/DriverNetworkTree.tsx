'use client'

import type { DriverNetworkHierarchy, DriverNetworkNode } from '../../types'

// ─── Region helpers ──────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  zn: 'Zona Norte',
  zs: 'Zona Sul',
  zo: 'Zona Oeste',
  baixada: 'Baixada',
  inter: 'Interior',
}

const REGION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  zn: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  zs: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/25' },
  zo: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/25' },
  baixada: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' },
  inter: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/25' },
}

function buildAvatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?'
}

function regionStyle(region?: string) {
  if (!region) return null
  return REGION_COLORS[region] ?? { bg: 'bg-[#E6D2B3]/8', text: 'text-[#E6D2B3]/50', border: 'border-[#E6D2B3]/15' }
}

function regionLabel(region?: string): string {
  if (!region) return ''
  return REGION_LABELS[region] ?? region
}

// ─── Node Card ────────────────────────────────────────────────────────────────

type NodeVariant = 'me' | 'referredBy' | 'referral'

interface NodeCardProps {
  node: DriverNetworkNode
  variant: NodeVariant
}

function NodeCard({ node, variant }: NodeCardProps) {
  const rStyle = regionStyle(node.region)

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
        variant === 'me'
          ? 'border-[#F28C28]/50 bg-[#2B1E15] shadow-[0_0_20px_0_rgba(242,140,40,0.10)]'
          : variant === 'referredBy'
          ? 'border-[#E6D2B3]/15 bg-[#2B1E15]/50'
          : 'border-[#E6D2B3]/10 bg-[#2B1E15]'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          variant === 'me'
            ? 'bg-[#F28C28] text-[#1E140F]'
            : variant === 'referredBy'
            ? 'bg-[#3B2A1F] text-[#E6D2B3]/40'
            : 'bg-[#3B2A1F] text-[#E6D2B3]'
        }`}
      >
        {buildAvatarLabel(node.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`truncate font-semibold ${
              variant === 'me'
                ? 'text-[#E6D2B3]'
                : variant === 'referredBy'
                ? 'text-[#E6D2B3]/50'
                : 'text-[#E6D2B3]'
            }`}
          >
            {node.name}
          </p>
          {variant === 'me' && (
            <span className="rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 px-2 py-0.5 text-[10px] font-bold text-[#F28C28]">
              Você
            </span>
          )}
          {variant === 'referredBy' && (
            <span className="rounded-full border border-[#E6D2B3]/15 bg-[#E6D2B3]/8 px-2 py-0.5 text-[10px] font-medium text-[#E6D2B3]/50">
              Te indicou
            </span>
          )}
        </div>
        {node.region && rStyle && (
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}
          >
            📍 {regionLabel(node.region)}
          </span>
        )}
      </div>

      {/* Depth pill */}
      {node.depth > 0 && (
        <span className="shrink-0 rounded-full border border-[#E6D2B3]/10 bg-[#E6D2B3]/8 px-2 py-0.5 text-[10px] text-[#E6D2B3]/40">
          nível {node.depth}
        </span>
      )}
    </div>
  )
}

// ─── Recursive referrals tree ─────────────────────────────────────────────────

interface ReferralTreeProps {
  nodes: DriverNetworkNode[]
}

function ReferralTree({ nodes }: ReferralTreeProps) {
  if (nodes.length === 0) return null
  return (
    <div className="ml-5 flex flex-col gap-2 border-l border-[#E6D2B3]/10 pl-4">
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col gap-2">
          <NodeCard node={node} variant="referral" />
          {node.referrals.length > 0 && <ReferralTree nodes={node.referrals} />}
        </div>
      ))}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface DriverNetworkTreeProps {
  hierarchy: DriverNetworkHierarchy
}

export function DriverNetworkTree({ hierarchy }: DriverNetworkTreeProps) {
  return (
    <div className="flex flex-col gap-3">

      {/* Summary stats */}
      {hierarchy.totalDrivers > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Motoristas</p>
            <p className="text-2xl font-bold text-[#E6D2B3]">{hierarchy.totalDrivers}</p>
            <p className="text-xs text-[#E6D2B3]/40">na sua rede</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-[#E6D2B3]/10 bg-[#2B1E15] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">Profundidade</p>
            <p className="text-2xl font-bold text-[#E6D2B3]">{hierarchy.maxDepth}</p>
            <p className="text-xs text-[#E6D2B3]/40">níveis</p>
          </div>
        </div>
      )}

      {/* Who referred me */}
      {hierarchy.referredBy && (
        <div className="flex flex-col gap-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6D2B3]/35">
            Quem te indicou
          </p>
          <NodeCard node={hierarchy.referredBy} variant="referredBy" />
        </div>
      )}

      {/* Me */}
      <div className="flex flex-col gap-1">
        {!hierarchy.referredBy && (
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/60">
            Você · origem da rede
          </p>
        )}
        <NodeCard node={hierarchy.me} variant="me" />
      </div>

      {/* Referrals tree */}
      {hierarchy.referrals.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6D2B3]/35">
            Motoristas indicados
          </p>
          <ReferralTree nodes={hierarchy.referrals} />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E6D2B3]/8 bg-[#2B1E15]/60 p-5 text-center">
          <p className="text-sm text-[#E6D2B3]/40">Nenhum motorista indicado ainda.</p>
          <p className="mt-1 text-xs text-[#E6D2B3]/25">
            Compartilhe seu código para expandir sua rede.
          </p>
        </div>
      )}
    </div>
  )
}
