import axios from 'axios';
import { smokeConfig } from '../config/smokeConfig';
import { SmokeContext } from '../context/smokeContext';

const isSmokeDebugEnabled = process.env.SMOKE_DEBUG === 'true';

// ─── Domain types ────────────────────────────────────────────────────────────

type CapabilityMap = Partial<{
  driverToDriver: boolean;
  driverToPassenger: boolean;
  passengerToPassenger: boolean;
  d2d: boolean;
  d2p: boolean;
  p2p: boolean;
}>;

type InviteUrlMap = Partial<{
  driverToDriver: string;
  driverToPassenger: string;
  passengerToPassenger: string;
  d2d: string;
  d2p: string;
  p2p: string;
}>;

interface GenealogyNode {
  id: string;
  name?: string;
  [key: string]: unknown;
}

interface GenealogyShape {
  me?: GenealogyNode;
  ancestors?: GenealogyNode[];
  descendants?: GenealogyNode[];
  lateral?: GenealogyNode[];
  operationalOwner?: GenealogyNode;
}

interface NetworkContextRaw {
  actorId?: string;
  rootDriverId?: string;
  rootDriver?: { id: string; name?: string };
  rootDriverName?: string;
  state?: string;
  ownership?: { type?: string };
  targetActorExpected?: string;
  relationships?: unknown[];
  genealogy?: GenealogyShape | GenealogyNode[];
  capabilities?: CapabilityMap;
  inviteCapabilities?: CapabilityMap;
  inviteUrls?: InviteUrlMap;
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toGenealogyArray(
  genealogy: GenealogyShape | GenealogyNode[] | undefined | null,
  fallbackActorId: string,
): GenealogyNode[] {
  if (Array.isArray(genealogy)) {
    return genealogy;
  }

  if (genealogy && typeof genealogy === 'object') {
    const nodes: GenealogyNode[] = [
      ...(genealogy.me ? [genealogy.me] : []),
      ...(Array.isArray(genealogy.ancestors) ? genealogy.ancestors : []),
      ...(Array.isArray(genealogy.descendants) ? genealogy.descendants : []),
      ...(Array.isArray(genealogy.lateral) ? genealogy.lateral : []),
    ];
    if (nodes.length > 0) {
      return nodes;
    }
  }

  return [{ id: fallbackActorId }];
}

function normalizeNetworkContext(raw: NetworkContextRaw, ctx: SmokeContext): NetworkContextRaw {
  const genealogyShape = !Array.isArray(raw.genealogy)
    ? (raw.genealogy as GenealogyShape | undefined)
    : undefined;

  const actorId = raw.actorId ?? genealogyShape?.me?.id ?? ctx.driverId;
  const rootDriverId =
    raw.rootDriverId ??
    raw.rootDriver?.id ??
    genealogyShape?.operationalOwner?.id ??
    ctx.driverId;

  return {
    ...raw,
    state: raw.state ?? 'ACTIVE',
    actorId,
    rootDriverId,
    rootDriverName: raw.rootDriverName ?? raw.rootDriver?.name,
    ownership: raw.ownership ?? { type: raw.targetActorExpected ?? 'driver' },
    relationships: raw.relationships ?? [],
    genealogy: toGenealogyArray(raw.genealogy, actorId),
    capabilities: raw.capabilities ?? raw.inviteCapabilities ?? {},
  };
}

export async function getNetworkContext(ctx: SmokeContext): Promise<NetworkContextRaw> {
  if (!ctx.driverId) {
    throw new Error('Missing driverId in smoke context for /network/context');
  }

  const actorId = ctx.driverId;
  const actorType = 'driver';
  const url =
    `${smokeConfig.apiUrl}/network/context?actorId=${encodeURIComponent(actorId)}` +
    `&actorType=${encodeURIComponent(actorType)}`;
  const headers = {
    ...(ctx.driverToken ? { Authorization: `Bearer ${ctx.driverToken}` } : {}),
    'x-driver-id': ctx.driverId,
    // Bypass ngrok's browser-warning HTML interstitial on free-plan tunnels.
    // Harmless on non-ngrok servers (ignored as an unknown header).
    'ngrok-skip-browser-warning': 'any',
  };

  if (isSmokeDebugEnabled) {
    console.log('SMOKE DEBUG network/context request', {
      url,
      headers: {
        Authorization: ctx.driverToken ? 'Bearer [present]' : undefined,
        'x-driver-id': ctx.driverId,
      },
    });
  }

  try {
    const res = await axios.get(url, { headers });
    const normalized = normalizeNetworkContext(res.data as NetworkContextRaw, ctx);
    if (isSmokeDebugEnabled) {
      console.log('SMOKE DEBUG network/context response', {
        state: normalized.state,
        actorId: normalized.actorId,
        rootDriverId: normalized.rootDriverId,
        genealogySize: Array.isArray(normalized.genealogy) ? normalized.genealogy.length : 0,
      });
    }
    return normalized;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `GET /network/context failed with status ${error.response?.status ?? 'unknown'}: ${JSON.stringify(error.response?.data ?? {})}`,
      );
    }
    throw error;
  }
}

export async function getInviteUrls(ctx: SmokeContext) {
  const context = await getNetworkContext(ctx);
  const inviteUrls: InviteUrlMap = context.inviteUrls ?? {};

  return {
    driverToDriver: inviteUrls.driverToDriver ?? inviteUrls.d2d ?? null,
    driverToPassenger: inviteUrls.driverToPassenger ?? inviteUrls.d2p ?? null,
    passengerToPassenger: inviteUrls.passengerToPassenger ?? inviteUrls.p2p ?? null,
  };
}

export type { CapabilityMap, InviteUrlMap, NetworkContextRaw, GenealogyNode };
