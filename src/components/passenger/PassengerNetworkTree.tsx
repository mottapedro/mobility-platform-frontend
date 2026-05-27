'use client'

import { useMemo, useState } from 'react'
import { NetworkTree, type NetworkHierarchy, type NetworkNode, type NetworkStatCard } from '../network/NetworkTree'
import { buildPassengerReferralSlug } from '../../services/passengers'
import type { PassengerNetwork, PassengerNetworkHierarchy, PassengerNetworkReferral } from '../../types'

interface PassengerNetworkTreeProps {
  passengerId: string | null
  passengerName: string
  network: PassengerNetwork | null
  hierarchy: PassengerNetworkHierarchy | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function ReferralMeta({ referral }: { referral: PassengerNetworkReferral }) {
  const ridesCount = referral.ridesCount ?? 0
  const active = referral.status === 'active' || ridesCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#9A7D5A]">
      <span
        className={`rounded-full border px-2 py-0.5 font-semibold ${
          active
            ? 'border-[#3DB87A]/30 bg-[#3DB87A]/10 text-[#3DB87A]'
            : 'border-[#2E1A08] bg-[#2E1A08] text-[#9A7D5A]'
        }`}
      >
        {active ? 'Ativo' : 'Novo'}
      </span>
      <span>{ridesCount} rides</span>
      <span>Entrada em {formatDate(referral.createdAt)}</span>
    </div>
  )
}

function mapPassengerNode(
  node: PassengerNetworkHierarchy['me'] | NonNullable<PassengerNetworkHierarchy['referredBy']>,
  referralsById: Map<string, PassengerNetworkReferral>,
): NetworkNode {
  const maybeReferrals = 'referrals' in node && Array.isArray(node.referrals) ? node.referrals : []
  const referral = referralsById.get(node.id)

  return {
    id: node.id,
    name: node.name,
    depth: Number(node.networkLevel ?? 0),
    referrals: maybeReferrals.map((child) => mapPassengerNode(child, referralsById)),
    meta: referral ? <ReferralMeta referral={referral} /> : null,
  }
}

function mapFallbackHierarchy({
  passengerId,
  passengerName,
  referrals,
  totalReferrals,
}: {
  passengerId: string | null
  passengerName: string
  referrals: PassengerNetworkReferral[]
  totalReferrals: number
}): NetworkHierarchy | null {
  if (!passengerId) return null

  return {
    me: { id: passengerId, name: passengerName, depth: 0, referrals: [] },
    referredBy: null,
    referrals: referrals.map((referral) => ({
      id: referral.id,
      name: referral.name,
      depth: 1,
      referrals: [],
      meta: <ReferralMeta referral={referral} />,
    })),
    totalItems: totalReferrals,
    maxDepth: referrals.length > 0 ? 1 : 0,
  }
}

function buildReferralUrl(passengerId: string | null, passengerName: string): string {
  if (typeof window === 'undefined') return ''
  const code = buildPassengerReferralSlug(passengerName)
  if (!code) return ''
  const query = passengerId ? `?originPassengerId=${encodeURIComponent(passengerId)}` : ''
  return `${window.location.origin}/r/${code}${query}`
}

function PassengerEmptyState({
  passengerId,
  passengerName,
}: {
  passengerId: string | null
  passengerName: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = buildReferralUrl(passengerId, passengerName)
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => { /* ignore clipboard errors */ })
  }

  return (
    <div
      data-testid="passenger-empty-state"
      className="flex flex-col items-center gap-5 rounded-2xl border border-[#F28C28]/20 bg-[#1A0E04] p-8 text-center shadow-[0_0_40px_0_rgba(242,140,40,0.06)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#F28C28]/20 bg-[#F28C28]/8 shadow-[0_0_20px_0_rgba(242,140,40,0.12)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="none"/>
          <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5zm-5-3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1z" fill="currentColor" className="text-[#F28C28]/40"/>
          <circle cx="12" cy="12" r="3" fill="currentColor" className="text-[#F28C28]/60"/>
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-semibold text-[#F5ECD8]">Sua rede ainda está começando</p>
        <p className="text-sm text-[#9A7D5A]">
          Compartilhe seu link para convidar passageiros para o Aliado.
        </p>
      </div>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-6 py-2.5 text-sm font-bold text-[#0D0700] transition-all hover:bg-[#F28C28]/90 active:scale-95"
      >
        {copied ? '✓ Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}

export function PassengerNetworkTree({
  passengerId,
  passengerName,
  network,
  hierarchy,
  loading,
  error,
  onRetry,
}: PassengerNetworkTreeProps) {
  const referrals = useMemo(() => network?.recentReferrals ?? [], [network?.recentReferrals])
  const mappedHierarchy = useMemo<NetworkHierarchy | null>(() => {
    const referralsById = new Map(referrals.map((referral) => [referral.id, referral]))

    if (!hierarchy) {
      return mapFallbackHierarchy({
        passengerId,
        passengerName,
        referrals,
        totalReferrals: network?.totalReferrals ?? 0,
      })
    }

    return {
      me: mapPassengerNode(hierarchy.me, referralsById),
      referredBy: hierarchy.referredBy ? mapPassengerNode(hierarchy.referredBy, referralsById) : null,
      referrals: hierarchy.referrals.map((node) => mapPassengerNode(node, referralsById)),
      totalItems: hierarchy.totalPassengers,
      maxDepth: hierarchy.maxDepth,
    }
  }, [hierarchy, network?.totalReferrals, passengerId, passengerName, referrals])

  const activeReferrals =
    network?.activeReferrals ??
    referrals.filter((referral) => referral.status === 'active' || (referral.ridesCount ?? 0) > 0).length
  const networkRides = network?.ridesFromNetwork ?? referrals.reduce((sum, referral) => sum + (referral.ridesCount ?? 0), 0)
  const growth = network?.growth ?? network?.growthPercent ?? network?.level1.length ?? 0
  const levelSummary = network
    ? `${network.level1.length} L1 / ${network.level2.length} L2 / ${network.level3.length} L3`
    : '0 L1 / 0 L2 / 0 L3'
  const stats: NetworkStatCard[] | undefined = network
    ? [
        { label: 'Referrals', value: network.totalReferrals, sub: levelSummary },
        { label: 'Ativos', value: activeReferrals, sub: 'com movimento' },
        { label: 'Crescimento', value: `+${growth}`, sub: 'janela atual' },
        { label: 'Rides da rede', value: networkRides, sub: 'corridas geradas' },
      ]
    : undefined

  const hasReferrals = (mappedHierarchy?.referrals.length ?? 0) > 0
  const emptyStateSlot = !hasReferrals ? (
    <PassengerEmptyState passengerId={passengerId} passengerName={passengerName} />
  ) : undefined

  return (
    <NetworkTree
      hierarchy={mappedHierarchy}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyStateSlot={emptyStateSlot}
      labels={{
        loadingAriaLabel: 'Carregando rede de passageiros',
        loadingText: 'Carregando rede de passageiros...',
        primaryTab: 'Passageiros',
        statsTab: 'Estatísticas',
        totalLabel: 'Referrals',
        totalSub: levelSummary,
        depthLabel: 'Profundidade',
        depthSub: 'níveis sociais',
        referredByTitle: 'Quem te convidou',
        referredByBadge: 'Te convidou',
        rootTitle: 'Você - origem da rede',
        referralsTitle: 'Passageiros indicados',
        emptyTitle: 'Nenhum passageiro indicado ainda.',
        emptyHint: 'Compartilhe seu link para iniciar a primeira conexão.',
        meBadge: 'Você',
      }}
      stats={stats}
    />
  )
}
