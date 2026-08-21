import { confirmRideQuote, createRide } from "./rides";

jest.mock("./api", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "./api";

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("rides service — Fase E (contrato bifásico create → confirm-quote)", () => {
  const payload = {
    passengerId: "psg_001",
    origin: "Barra da Tijuca, Rio de Janeiro",
    destination: "Aeroporto Galeão, Rio de Janeiro",
    scheduledAt: "2030-01-01T12:00:00.000Z",
    context: { isVip: false, isAirport: true },
    originLatitude: -23.0013,
    originLongitude: -43.3222,
    destinationLatitude: -22.8102,
    destinationLongitude: -43.2506,
  };

  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  it("createRide POSTs /rides e devolve ride + RideQuote QUOTED (fluxo bifásico M1)", async () => {
    mockApiRequest.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: { id: "ride_001", status: "PENDING", offers: [] },
      quote: null,
      rideQuote: {
        id: "quote_001",
        rideRequestId: "ride_001",
        pricingDriverId: "driver_001",
        status: "QUOTED",
        version: 1,
        grossFinalCents: 2902,
        driverReceivableAmountCents: 2500,
        expiresAt: "2030-01-01T12:15:00.000Z",
        agreedAt: null,
        createdAt: "2030-01-01T11:55:00.000Z",
      },
    });

    const result = await createRide(payload);

    expect(mockApiRequest).toHaveBeenCalledWith("/rides", {
      method: "POST",
      body: payload,
    });
    expect(result.ride.id).toBe("ride_001");
    expect(result.ride.status).toBe("PENDING");
    expect(result.rideQuote?.status).toBe("QUOTED");
    expect(result.rideQuote?.grossFinalCents).toBe(2902);
    expect((result.ride as { offers: unknown[] }).offers).toEqual([]);
  });

  it("confirmRideQuote POSTs /rides/:id/confirm-quote (sem body) e devolve AGREED + primeira oferta", async () => {
    mockApiRequest.mockResolvedValue({
      message: "Quote confirmada — primeira oferta emitida",
      ride: {
        id: "ride_001",
        status: "PENDING",
        offers: [{ id: "offer_001", status: "PENDING" }],
      },
      rideQuote: {
        id: "quote_001",
        rideRequestId: "ride_001",
        pricingDriverId: "driver_001",
        status: "AGREED",
        version: 2,
        grossFinalCents: 2902,
        driverReceivableAmountCents: 2500,
        expiresAt: "2030-01-01T12:15:00.000Z",
        agreedAt: "2030-01-01T12:00:00.000Z",
        createdAt: "2030-01-01T11:55:00.000Z",
      },
      firstOfferId: "offer_001",
    });

    const result = await confirmRideQuote("ride_001");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/rides/ride_001/confirm-quote",
      {
        method: "POST",
      },
    );
    expect(result.rideQuote?.status).toBe("AGREED");
    expect(result.firstOfferId).toBe("offer_001");
  });

  it("confirmRideQuote encaminha o código de erro do backend (QUOTE_EXPIRED / QUOTE_CONFLICT)", async () => {
    mockApiRequest.mockRejectedValue(
      Object.assign(new Error("Quote não pode ser confirmada"), {
        status: 409,
        code: "QUOTE_EXPIRED",
      }),
    );

    await expect(confirmRideQuote("ride_001")).rejects.toMatchObject({
      status: 409,
      code: "QUOTE_EXPIRED",
    });

    mockApiRequest.mockRejectedValue(
      Object.assign(new Error("Quote não pode ser confirmada"), {
        status: 409,
        code: "QUOTE_CONFLICT",
      }),
    );

    await expect(confirmRideQuote("ride_001")).rejects.toMatchObject({
      status: 409,
      code: "QUOTE_CONFLICT",
    });
  });
});
