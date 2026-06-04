import axios from 'axios';
import { smokeConfig } from '../config/smokeConfig';
import { SmokeContext } from '../context/smokeContext';

const isSmokeDebugEnabled = process.env.SMOKE_DEBUG === 'true';

type LooseObject = Record<string, any>;

function toGenealogyArray(genealogy: any, fallbackActorId: string): any[] {
  if (Array.isArray(genealogy)) {
    return genealogy;
  }

  if (genealogy && typeof genealogy === 'object') {
    const nodes = [
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

function normalizeNetworkContext(raw: LooseObject, ctx: SmokeContext): LooseObject {
  const actorId = raw.actorId ?? raw.genealogy?.me?.id ?? ctx.driverId;
  const rootDriverId =
    raw.rootDriverId ??
    raw.rootDriver?.id ??
    raw.genealogy?.operationalOwner?.id ??
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

export async function getNetworkContext(ctx: SmokeContext) {
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
    const normalized = normalizeNetworkContext(res.data as LooseObject, ctx);
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
  const inviteUrls = context?.inviteUrls ?? {};

  return {
    driverToDriver: inviteUrls.driverToDriver ?? inviteUrls.d2d ?? null,
    driverToPassenger: inviteUrls.driverToPassenger ?? inviteUrls.d2p ?? null,
    passengerToPassenger: inviteUrls.passengerToPassenger ?? inviteUrls.p2p ?? null,
  };
}
