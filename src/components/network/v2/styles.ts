import type { InfluenceTier } from '@/types/network-v2'

export type NetworkClusterVariant = 'hub' | 'driver' | 'passenger' | 'indirect'

export const NETWORK_METRIC_PILL = {
  wrapper: 'flex flex-col items-center rounded-xl border border-aliado-border bg-aliado-card px-3 py-2 text-center',
  label: 'text-[10px] font-semibold uppercase tracking-widest text-aliado-sub',
  value: 'mt-0.5 text-lg font-bold text-aliado-text',
}

export const NETWORK_TAB_BUTTON = {
  base: 'rounded-full px-3 py-1 text-xs font-bold transition-colors',
  active: 'bg-aliado-orange text-aliado-bg',
  idle: 'border border-aliado-border bg-aliado-card text-aliado-sub hover:border-aliado-orange/30',
}

export const NETWORK_BRANCH_LINE_BY_TIER: Partial<Record<InfluenceTier, string>> = {
  ROOT: 'border-aliado-orange/40',
  ELITE: 'border-aliado-orange/25',
  HUB: 'border-aliado-success/25',
  EXPANSION: 'border-aliado-orange/15',
  OPERATIONAL: 'border-aliado-border',
  BEGINNER: 'border-aliado-border',
  CLIENT: 'border-aliado-border-soft',
}

export const NETWORK_BRANCH_BG_BY_TIER: Partial<Record<InfluenceTier, string>> = {
  ROOT: 'bg-aliado-orange/40',
  ELITE: 'bg-aliado-orange/25',
  HUB: 'bg-aliado-success/25',
  EXPANSION: 'bg-aliado-orange/15',
  OPERATIONAL: 'bg-aliado-border',
  BEGINNER: 'bg-aliado-border',
  CLIENT: 'bg-aliado-border-soft',
}

export const NETWORK_DRIVER_TIER_CARD_STYLES: Record<string, { wrapper: string; nameSize: string }> = {
  root: { wrapper: 'border-aliado-orange/50 bg-aliado-card min-h-[76px]', nameSize: 'text-base' },
  leader: { wrapper: 'border-aliado-orange/30 bg-aliado-card-soft min-h-[60px]', nameSize: 'text-sm' },
  operator: { wrapper: 'border-aliado-border bg-aliado-card-sub min-h-[52px]', nameSize: 'text-sm' },
  client: { wrapper: 'border-aliado-border bg-aliado-card-sub min-h-12', nameSize: 'text-sm' },
}

export const NETWORK_DRIVER_GLOW = {
  root: 'shadow-[0_0_20px_rgba(242,140,40,0.30)]',
  elite: 'shadow-[0_0_14px_rgba(242,140,40,0.25)]',
  hub: 'shadow-[0_0_10px_rgba(61,184,122,0.20)]',
}

export const NETWORK_CLUSTER_STYLES: Record<
NetworkClusterVariant,
{ defaultLabel: string; dot: string; border: string; text: string }
> = {
  hub: {
    defaultLabel: 'HUBS OPERACIONAIS',
    dot: 'bg-aliado-success',
    border: 'border-aliado-success/20',
    text: 'text-aliado-success',
  },
  driver: {
    defaultLabel: 'REDE D2D',
    dot: 'bg-aliado-orange',
    border: 'border-aliado-orange/15',
    text: 'text-aliado-orange/70',
  },
  passenger: {
    defaultLabel: 'EXPANSÃO D2P',
    dot: 'bg-aliado-sub',
    border: 'border-aliado-sub/20',
    text: 'text-aliado-sub',
  },
  indirect: {
    defaultLabel: 'REDE INDIRETA',
    dot: 'bg-aliado-muted',
    border: 'border-aliado-muted/20',
    text: 'text-aliado-muted',
  },
}

export const NETWORK_LEVEL_GROUP = {
  flankLeft: 'h-px flex-1 bg-linear-to-r from-transparent to-aliado-orange/20',
  flankRight: 'h-px flex-1 bg-linear-to-l from-transparent to-aliado-orange/20',
  pill: 'flex shrink-0 items-center gap-2 rounded-full border border-aliado-orange/15 bg-aliado-card px-3 py-1',
  title: 'text-[10px] font-bold uppercase tracking-widest text-aliado-orange/70',
  divider: 'text-aliado-muted-deep',
  meta: 'text-[10px] text-aliado-muted',
}

export const NETWORK_SOCIAL = {
  actorName: 'truncate text-sm font-semibold text-aliado-text',
  actorMeta: 'text-xs text-aliado-sub',
  meRow: 'lineage-panel my-1 flex items-center gap-3 px-3 py-2',
  driverRow: 'social-node flex items-center gap-3 px-3 py-2',
  passengerRow: 'flex items-center gap-3 rounded-xl border border-aliado-border-soft bg-aliado-card-subtle px-3 py-2',
  passengerName: 'truncate text-sm font-medium text-aliado-text-soft',
  lineageDivider: 'mb-1 border-t border-aliado-border',
  lineageConnector: 'absolute left-4.5 top-8 bottom-13 w-0.5 bg-aliado-border',
  topHint: 'py-3 text-xs text-aliado-muted',
}

export const NETWORK_LATERAL = {
  driverRow: 'social-node flex items-center gap-3 px-3 py-2',
  passengerRow: 'flex items-center gap-3 rounded-xl border border-aliado-border-soft bg-aliado-card-subtle px-3 py-2',
  driverName: 'truncate text-sm font-medium text-aliado-text',
  passengerName: 'truncate text-sm font-medium text-aliado-text-soft',
  meta: 'text-xs text-aliado-sub',
}

export const NETWORK_PASSENGER_NODE = {
  wrapper: 'flex items-center gap-2.5 rounded-xl border border-aliado-border-soft bg-aliado-card-subtle px-3 py-2 min-h-12',
  interactive: 'cursor-pointer hover:border-aliado-border transition-colors duration-150',
  name: 'truncate text-sm font-medium text-aliado-text-soft',
  type: 'text-[10px] font-semibold uppercase tracking-wide text-aliado-sub-soft',
  level: 'text-[10px] text-aliado-muted-deep',
  chevron: 'text-[10px] text-aliado-muted-deep transition-transform duration-200',
}

export const NETWORK_INFLUENCE_BADGE = {
  wrapper: 'influence-badge',
}
