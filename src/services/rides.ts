import { apiRequest } from "./api";
import type {
  ConfirmQuoteResponse,
  CreateRidePayload,
  CreateRideResponse,
  Offer,
  Passenger,
  Ride,
  RideLocation,
} from "../types";

export interface CreatePassengerPayload {
  name: string;
  email: string;
  phone: string;
  referredByDriverId?: string;
}

export async function createPassenger(
  payload: CreatePassengerPayload,
): Promise<Passenger> {
  return apiRequest("/passengers", { method: "POST", body: payload });
}

export async function createRide(
  payload: CreateRidePayload,
): Promise<CreateRideResponse> {
  return apiRequest("/rides", { method: "POST", body: payload });
}

/**
 * Fase E (bifase) — transição QUOTED → AGREED + emissão da primeira oferta para
 * o M1. Idempotente no backend: um retry após AGREED retorna o mesmo contrato
 * e não duplica oferta. Quando a rede falha, o cliente pode repetir a chamada
 * com a MESMA rideId — nunca precisando criar outra RideRequest.
 */
export async function confirmRideQuote(
  rideId: string,
): Promise<ConfirmQuoteResponse> {
  return apiRequest(`/rides/${rideId}/confirm-quote`, { method: "POST" });
}

export async function getRide(rideId: string): Promise<Ride> {
  return apiRequest(`/rides/${rideId}`);
}

export async function getRideLocation(rideId: string): Promise<RideLocation> {
  return apiRequest(`/trips/${rideId}/location`);
}

export interface GpsPingPayload {
  driverId: string;
  lat: number;
  lng: number;
  direcaoGraus: number;
}

export async function sendGpsPing(
  rideId: string,
  payload: GpsPingPayload,
): Promise<void> {
  return apiRequest(`/trips/${rideId}/gps-ping`, {
    method: "POST",
    body: payload,
  });
}

export async function getPendingRides(): Promise<Ride[]> {
  return apiRequest("/rides?status=pending");
}

export async function updateRide(
  rideId: string,
  body: Record<string, unknown>,
): Promise<void> {
  return apiRequest(`/rides/${rideId}`, { method: "PATCH", body });
}

export interface RideLifecycleResult {
  rideId: string;
  status: string;
  started?: boolean;
  completed?: boolean;
}

// PATCH /rides/:id is RPC-style and only accepts action: 'reject_referral' |
// 'reschedule' (ride.controller.ts:282). State-machine transitions go
// through the dedicated lifecycle endpoints instead — no body needed, they
// read only req.params.id.
export async function startRideLifecycle(
  rideId: string,
): Promise<RideLifecycleResult> {
  return apiRequest(`/rides/${rideId}/lifecycle/start`, { method: "POST" });
}

export async function completeRideLifecycle(
  rideId: string,
): Promise<RideLifecycleResult> {
  return apiRequest(`/rides/${rideId}/lifecycle/complete`, { method: "POST" });
}

export async function getRidesByPassenger(
  passengerId: string,
): Promise<Ride[]> {
  return apiRequest(`/rides?passengerId=${passengerId}`);
}

export async function respondOffer(
  offerId: string,
  accept: boolean,
): Promise<void> {
  return apiRequest(`/offers/${offerId}/respond`, {
    method: "PATCH",
    body: { accept },
  });
}

export async function getPassenger(passengerId: string): Promise<Passenger> {
  return apiRequest(`/passengers/${passengerId}`);
}

export async function getDriverOffers(driverId: string): Promise<Offer[]> {
  return apiRequest(`/drivers/${driverId}/offers`);
}
