import { test, expect } from "@playwright/test";
import { SmokeApi } from "../smoke/support/api";
import { loadSmokeEnv } from "../smoke/support/env";

// Fase E — prova o contrato bifásico da quote ponta a ponta via HTTP:
//   POST /rides            → Ride + RideQuote QUOTED e ZERO ofertas
//   POST /rides/:id/confirm-quote → QUOTED → AGREED + 1 oferta PENDING para o M1
//
// Este spec só faz sentido para o passageiro aliado (M1 = referredByDriverId),
// cujo fluxo é quote-gated. Sem M1 o POST /rides não emite quote e o
// confirm-quote responderia 404 QUOTE_NOT_FOUND.

const env = loadSmokeEnv();

let api: SmokeApi;
let passenger: Awaited<ReturnType<SmokeApi["loginPassenger"]>>;

test.describe("Fase E — quote bifásica (create → 0 offers → confirm → 1 offer M1)", () => {
  test.skip(
    !env,
    "Smoke env not configured: set SMOKE_API_URL + SMOKE_{PASSENGER,DRIVER}_{EMAIL,PASSWORD}",
  );

  let createdRideId: string | undefined;

  test.beforeAll(async () => {
    api = await SmokeApi.create(env!.apiUrl);
    passenger = await api.loginPassenger(
      env!.passengerEmail,
      env!.passengerPassword,
    );
  });

  test.skip(
    () => !passenger?.referredByDriverId,
    "Passageiro de smoke não possui M1 (referredByDriverId) — fluxo bifásico não aplicável",
  );

  test.afterAll(async () => {
    if (createdRideId)
      await api.tryCancel(createdRideId, passenger.token).catch(() => {});
    await api?.dispose();
  });

  test("POST /rides emite RideQuote QUOTED com ZERO ofertas", async () => {
    const scheduledAt = new Date(Date.now() + 96 * 60 * 60_000).toISOString();
    const created = await api.createRideFullOrReclaim(
      {
        passengerId: passenger.passengerId,
        origin: env!.originAddress,
        destination: env!.destinationAddress,
        scheduledAt,
        originLat: -23.5613,
        originLng: -46.6565,
        destinationLat: -23.5631,
        destinationLng: -46.6543,
      },
      passenger.token,
    );
    createdRideId = created.ride.id;

    // 1) POST /rides deve retornar a RideQuote QUOTED com preço em centavos.
    expect(
      created.rideQuote,
      "POST /rides deve retornar RideQuote para corrida M1",
    ).toBeTruthy();
    expect(created.rideQuote!.status).toBe("QUOTED");
    expect(created.rideQuote!.grossFinalCents).toBeGreaterThan(0);
    expect(created.rideQuote!.version).toBe(1);

    // 2) Nenhuma oferta antes da confirmação do passageiro.
    const before = await api.getRideWithOffers(created.ride.id);
    expect(
      before.offers,
      "Corrida M1 com quote pendente não deve ter ofertas",
    ).toEqual([]);
  });

  test("POST /rides/:id/confirm-quote transita AGREED e emite 1 oferta PENDING para o M1", async () => {
    const scheduledAt = new Date(Date.now() + 100 * 60 * 60_000).toISOString();
    const created = await api.createRideFullOrReclaim(
      {
        passengerId: passenger.passengerId,
        origin: env!.originAddress,
        destination: env!.destinationAddress,
        scheduledAt,
        originLat: -23.5613,
        originLng: -46.6565,
        destinationLat: -23.5631,
        destinationLng: -46.6543,
      },
      passenger.token,
    );
    createdRideId = created.ride.id;

    expect(
      created.rideQuote,
      "POST /rides deve retornar RideQuote para corrida M1",
    ).toBeTruthy();
    expect(created.rideQuote!.status).toBe("QUOTED");

    // 3) Confirmação explícita do passageiro.
    const confirmed = await api.confirmQuote(created.ride.id);
    expect(confirmed.message).toContain("primeira oferta emitida");
    expect(confirmed.rideQuote?.status).toBe("AGREED");
    expect(confirmed.firstOfferId).toBeTruthy();

    // 4) Exatamente uma oferta PENDING para o M1 (referredByDriverId).
    const after = await api.getRideWithOffers(created.ride.id);
    expect(after.offers, "Oferta M1 deve ter sido emitida").toHaveLength(1);
    expect(after.offers[0].driverId).toBe(passenger.referredByDriverId);
    expect(after.offers[0].status).toBe("PENDING");

    // 5) Idempotência — segundo confirm não duplica a oferta nem recria a ride.
    const again = await api.confirmQuote(created.ride.id);
    expect(again.message).toContain("primeira oferta emitida");
    expect(again.rideQuote?.status).toBe("AGREED");
    const afterAgain = await api.getRideWithOffers(created.ride.id);
    expect(afterAgain.offers).toHaveLength(1);
  });
});
