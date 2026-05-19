'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

export interface NetworkNode {
  id: string
  name: string
  region?: string
  depth: number
  referrals: NetworkNode[]
  meta?: ReactNode
}

export interface NetworkHierarchy {
  me: NetworkNode
  referredBy: NetworkNode | null
  referrals: NetworkNode[]
  totalItems: number
  maxDepth: number
}

export interface NetworkStatCard {
  label: string
  value: string | number
  sub?: string
}

interface NetworkTreeLabels {
  loadingAriaLabel: string
  loadingText: string
  primaryTab: string
  statsTab: string
  totalLabel: string
  totalSub: string
  depthLabel: string
  depthSub: string
  referredByTitle: string
  referredByBadge: string
  rootTitle: string
  referralsTitle: string
  emptyTitle: string
  emptyHint: string
  meBadge: string
}

const DEFAULT_LABELS: NetworkTreeLabels = {
  loadingAriaLabel: 'Carregando rede',
  loadingText: 'Carregando rede...',
  primaryTab: 'Hierarquia',
  statsTab: 'Estatísticas',
  totalLabel: 'Pessoas',
  totalSub: 'na sua rede',
  depthLabel: 'Profundidade',
  depthSub: 'níveis',
  referredByTitle: 'Quem te indicou',
  referredByBadge: 'Te indicou',
  rootTitle: 'Você - origem da rede',
  referralsTitle: 'Indicados',
  emptyTitle: 'Nenhum indicado ainda.',
  emptyHint: 'Compartilhe seu link para expandir sua rede.',
  meBadge: 'Você',
}

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
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || '?'
}

function regionStyle(region?: string) {
  if (!region) return null
  return REGION_COLORS[region] ?? { bg: 'bg-[#2E1A08]', text: 'text-[#9A7D5A]', border: 'border-[#2E1A08]' }
}

function regionLabel(region?: string): string {
  if (!region) return ''
  return REGION_LABELS[region] ?? region
}

type NodeVariant = 'me' | 'referredBy' | 'referral'

function NodeCard({ node, variant, labels }: { node: NetworkNode; variant: NodeVariant; labels: NetworkTreeLabels }) {
  const rStyle = regionStyle(node.region)

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
        variant === 'me'
          ? 'border-[#F28C28]/50 bg-[#1A0E04] shadow-[0_0_20px_0_rgba(242,140,40,0.10)]'
          : variant === 'referredBy'
            ? 'border-[#2E1A08] bg-[#1A0E04]/50'
            : 'border-[#2E1A08] bg-[#1A0E04]'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          variant === 'me'
            ? 'bg-[#F28C28] text-[#0D0700]'
            : variant === 'referredBy'
              ? 'bg-[#1A0E04] text-[#9A7D5A]'
              : 'bg-[#1A0E04] text-[#F5ECD8]'
        }`}
      >
        {buildAvatarLabel(node.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`truncate font-semibold ${
              variant === 'me'
                ? 'text-[#F5ECD8]'
                : variant === 'referredBy'
                  ? 'text-[#9A7D5A]'
                  : 'text-[#F5ECD8]'
            }`}
          >
            {node.name}
          </p>
          {variant === 'me' && (
            <span className="rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 px-2 py-0.5 text-[10px] font-bold text-[#F28C28]">
              {labels.meBadge}
            </span>
          )}
          {variant === 'referredBy' && (
            <span className="rounded-full border border-[#2E1A08] bg-[#2E1A08] px-2 py-0.5 text-[10px] font-medium text-[#9A7D5A]">
              {labels.referredByBadge}
            </span>
          )}
        </div>
        {node.region && rStyle && (
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}
          >
            {regionLabel(node.region)}
          </span>
        )}
        {node.meta && <div className="mt-1">{node.meta}</div>}
      </div>

      {node.depth > 0 && (
        <span className="shrink-0 rounded-full border border-[#2E1A08] bg-[#2E1A08] px-2 py-0.5 text-[10px] text-[#9A7D5A]">
          nível {node.depth}
        </span>
      )}
    </div>
  )
}

function ReferralTree({ nodes, labels }: { nodes: NetworkNode[]; labels: NetworkTreeLabels }) {
  if (nodes.length === 0) return null

  return (
    <div className="ml-5 flex flex-col gap-2 border-l border-[#2E1A08] pl-4">
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col gap-2">
          <NodeCard node={node} variant="referral" labels={labels} />
          {node.referrals.length > 0 && <ReferralTree nodes={node.referrals} labels={labels} />}
        </div>
      ))}
    </div>
  )
}

function StatsPanel({ hierarchy, labels, stats }: { hierarchy: NetworkHierarchy; labels: NetworkTreeLabels; stats?: NetworkStatCard[] }) {
  const cards = stats ?? [
    { label: labels.totalLabel, value: hierarchy.totalItems, sub: labels.totalSub },
    { label: labels.depthLabel, value: hierarchy.maxDepth, sub: labels.depthSub },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="flex flex-col gap-1 rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/70">{card.label}</p>
          <p className="text-2xl font-bold text-[#F5ECD8]">{card.value}</p>
          {card.sub && <p className="text-xs text-[#9A7D5A]">{card.sub}</p>}
        </div>
      ))}
    </div>
  )
}

function HierarchyPanel({ hierarchy, labels, emptyStateSlot }: { hierarchy: NetworkHierarchy; labels: NetworkTreeLabels; emptyStateSlot?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {hierarchy.referredBy && (
        <div className="flex flex-col gap-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5ECD8]/35">
            {labels.referredByTitle}
          </p>
          <NodeCard node={hierarchy.referredBy} variant="referredBy" labels={labels} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {!hierarchy.referredBy && (
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/60">
            {labels.rootTitle}
          </p>
        )}
        <NodeCard node={hierarchy.me} variant="me" labels={labels} />
      </div>

      {hierarchy.referrals.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5ECD8]/35">
            {labels.referralsTitle}
          </p>
          <ReferralTree nodes={hierarchy.referrals} labels={labels} />
        </div>
      ) : (
        emptyStateSlot ?? (
          <div className="rounded-2xl border border-[#2E1A08] bg-[#1A0E04]/60 p-5 text-center">
            <p className="text-sm text-[#9A7D5A]">{labels.emptyTitle}</p>
            <p className="mt-1 text-xs text-[#F5ECD8]/25">{labels.emptyHint}</p>
          </div>
        )
      )}
    </div>
  )
}

type ActiveTab = 'hierarchy' | 'stats'

interface NetworkTreeProps {
  hierarchy?: NetworkHierarchy | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  labels?: Partial<NetworkTreeLabels>
  stats?: NetworkStatCard[]
  emptyStateSlot?: React.ReactNode
}

export function NetworkTree({ hierarchy, loading, error, onRetry, labels: labelOverrides, stats, emptyStateSlot }: NetworkTreeProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hierarchy')
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }

  if (loading) {
    return (
      <div
        role="status"
        aria-label={labels.loadingAriaLabel}
        className="flex flex-col items-center gap-3 py-16 text-[#9A7D5A]"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5A3F22] border-t-[#F28C28]" />
        <p className="text-sm">{labels.loadingText}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E05050]/30 bg-[#E05050]/10 p-6 text-center">
        <p className="text-sm text-[#E05050]">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-xl border border-[#E05050]/40 px-4 py-2 text-sm font-semibold text-[#E05050] transition-colors hover:bg-[#E05050]/15"
          >
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  if (!hierarchy) return null

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" className="flex rounded-xl border border-[#2E1A08] bg-[#1A0E04]/60 p-1">
        <button
          role="tab"
          aria-selected={activeTab === 'hierarchy'}
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === 'hierarchy'
              ? 'bg-[#F28C28] text-[#0D0700] shadow'
              : 'text-[#9A7D5A] hover:text-[#F5ECD8]'
          }`}
        >
          {labels.primaryTab}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === 'stats'
              ? 'bg-[#F28C28] text-[#0D0700] shadow'
              : 'text-[#9A7D5A] hover:text-[#F5ECD8]'
          }`}
        >
          {labels.statsTab}
        </button>
      </div>

      {activeTab === 'hierarchy' && <HierarchyPanel hierarchy={hierarchy} labels={labels} emptyStateSlot={emptyStateSlot} />}
      {activeTab === 'stats' && <StatsPanel hierarchy={hierarchy} labels={labels} stats={stats} />}
    </div>
  )
}
