import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import PassengerCreatePage from "./page";
import { ApiError } from "../../../services/api";
import type { Ride, RideQuote } from "../../../types";

const mockPush = jest.fn();
const mockUsePassenger = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../../hooks/usePassenger", () => ({
  usePassenger: (...args: unknown[]) => mockUsePassenger(...args),
}));

jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { passengerId: "psg_1" },
  }),
}));

jest.mock("../../../components/AuthGuard", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../../components/AppHeader", () => ({
  AppHeader: () => <div>header</div>,
}));

jest.mock("../../../services/rides", () => ({
  createRide: jest.fn(),
  confirmRideQuote: jest.fn(),
}));

import { confirmRideQuote, createRide } from "../../../services/rides";

const mockCreateRide = createRide as jest.MockedFunction<typeof createRide>;
const mockConfirmRideQuote = confirmRideQuote as jest.MockedFunction<
  typeof confirmRideQuote
>;

jest.mock("../../../components/passenger/AddressInput", () => ({
  AddressInput: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (
      val: string,
      coords: { lat: number; lng: number } | null,
    ) => void;
  }) => (
    <div>
      <label htmlFor={id}>{id}</label>
      <input
        id={id}
        value={value}
        onChange={(e) =>
          onChange(e.target.value, { lat: -23.5613, lng: -46.6565 })
        }
      />
    </div>
  ),
}));

const rideFixture: Ride = {
  id: "ride_001",
  passengerId: "psg_1",
  origin: "Barra da Tijuca, Rio de Janeiro",
  destination: "Aeroporto Galeão, Rio de Janeiro",
  scheduledAt: "2030-01-01T12:00:00.000Z",
  status: "PENDING",
  selectedDriverId: null,
  rootDriverId: "driver_1",
  operationalOwnerId: "driver_1",
  flowType: "D2D",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-20T10:00:00.000Z",
  createdBy: "passenger",
  updatedBy: "passenger",
  passenger: { user: { name: "Passageiro" } },
  offers: [],
};

const quoteFixture: RideQuote = {
  id: "quote_001",
  rideRequestId: "ride_001",
  pricingDriverId: "driver_1",
  status: "QUOTED",
  version: 1,
  grossFinalCents: 2902,
  driverReceivableAmountCents: 2500,
  expiresAt: "2030-01-01T12:15:00.000Z",
  agreedAt: null,
  createdAt: "2030-01-01T11:55:00.000Z",
};

const agreedQuoteFixture: RideQuote = {
  ...quoteFixture,
  status: "AGREED",
  version: 2,
};

const confirmedRideFixture: Ride = {
  ...rideFixture,
  offers: [
    {
      id: "offer_001",
      status: "PENDING",
      expiresAt: "2030-01-01T12:15:00.000Z",
      driver: { id: "driver_1", user: { name: "Pedro Motta" }, vehicles: [] },
    },
  ],
};

const aliadoPassengerData = {
  id: "psg_1",
  referredByDriverId: "driver_1",
  user: { name: "Passageiro" },
  referredByDriver: {
    id: "driver_1",
    user: { name: "Pedro Motta", phone: "21900000001" },
    vehicles: [],
  },
};

async function fillAndSubmitForm() {
  fireEvent.change(screen.getByLabelText("origin"), {
    target: { value: "Barra da Tijuca" },
  });
  fireEvent.change(screen.getByLabelText("destination"), {
    target: { value: "Galeão" },
  });
  const dtInput = document.querySelector(
    'input[type="datetime-local"]',
  ) as HTMLInputElement;
  fireEvent.change(dtInput, { target: { value: "2030-01-01T12:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar corrida" }));
}

describe("PassengerCreatePage", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockUsePassenger.mockReset();
    mockCreateRide.mockReset();
    mockConfirmRideQuote.mockReset();
  });

  it("keeps showing the stored referral driver without an error banner when backend loading fails", () => {
    localStorage.setItem(
      "aliado:referredDriver",
      JSON.stringify({
        id: "driver-1",
        name: "Pedro Motta",
        phone: "21900000001",
      }),
    );

    mockUsePassenger.mockReturnValue({
      data: null,
      loading: false,
      error: "Erro ao carregar",
    });

    render(<PassengerCreatePage />);

    expect(screen.getByText("Motorista aliado indicado")).toBeInTheDocument();
    expect(screen.getByText("Pedro Motta")).toBeInTheDocument();
    expect(screen.getByText("21900000001")).toBeInTheDocument();
    expect(
      screen.queryByText("Erro ao carregar motorista"),
    ).not.toBeInTheDocument();
  });

  it("shows the error banner when there is no stored referral driver", () => {
    mockUsePassenger.mockReturnValue({
      data: null,
      loading: false,
      error: "Erro ao carregar",
    });

    render(<PassengerCreatePage />);

    expect(screen.getByText("Erro ao carregar motorista")).toBeInTheDocument();
  });

  it("após POST /rides com M1: mostra a etapa de confirmação da quote (preço, trajeto, horário, validade) e NÃO navega", async () => {
    mockUsePassenger.mockReturnValue({
      data: aliadoPassengerData,
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: quoteFixture,
    });

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    expect(mockCreateRide).toHaveBeenCalledTimes(1);

    // Painel de confirmação exibido no lugar do formulário
    expect(
      await screen.findByRole("heading", { name: "Confirmar corrida" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Barra da Tijuca, Rio de Janeiro"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aeroporto Galeão, Rio de Janeiro"),
    ).toBeInTheDocument();
    expect(screen.getByText(/R\$ 29,02/)).toBeInTheDocument();
    expect(screen.getByText("Cotação válida até")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar corrida" }),
    ).toBeInTheDocument();

    // Formulário substituído — não é possível criar outra corrida enquanto a quote está pendente
    expect(
      screen.queryByRole("button", { name: "Criar corrida" }),
    ).not.toBeInTheDocument();

    // Nenhuma navegação imediata — o contrato bifásico exige a confirmação explícita
    await waitFor(() =>
      expect(mockPush).not.toHaveBeenCalledWith("/passenger/rides"),
    );
    expect(localStorage.getItem("passengerRideIds")).toBeNull();
  });

  it("confirma a corrida: chama confirm-quote com a MESMA rideId, grava e navega para /passenger/rides", async () => {
    mockUsePassenger.mockReturnValue({
      data: aliadoPassengerData,
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: quoteFixture,
    });
    mockConfirmRideQuote.mockResolvedValue({
      message: "Quote confirmada — primeira oferta emitida",
      ride: confirmedRideFixture,
      rideQuote: agreedQuoteFixture,
      firstOfferId: "offer_001",
    });

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    fireEvent.click(
      await screen.findByRole("button", { name: "Confirmar corrida" }),
    );

    await waitFor(() =>
      expect(mockConfirmRideQuote).toHaveBeenCalledWith("ride_001"),
    );
    expect(mockCreateRide).toHaveBeenCalledTimes(1);
    expect(mockConfirmRideQuote).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/passenger/rides"),
    );
    expect(localStorage.getItem("passengerRideIds")).toBeNull();
  });

  it("falha de rede no confirm-quote: retry reutiliza a mesma rideId e nunca cria outra RideRequest", async () => {
    mockUsePassenger.mockReturnValue({
      data: aliadoPassengerData,
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: quoteFixture,
    });
    mockConfirmRideQuote
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        message: "Quote confirmada — primeira oferta emitida",
        ride: confirmedRideFixture,
        rideQuote: agreedQuoteFixture,
        firstOfferId: "offer_001",
      });

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    fireEvent.click(
      await screen.findByRole("button", { name: "Confirmar corrida" }),
    );

    expect(
      await screen.findByText(/Falha ao confirmar a corrida/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar corrida" }));

    await waitFor(() => expect(mockConfirmRideQuote).toHaveBeenCalledTimes(2));
    expect(mockConfirmRideQuote).toHaveBeenNthCalledWith(1, "ride_001");
    expect(mockConfirmRideQuote).toHaveBeenNthCalledWith(2, "ride_001");
    expect(mockCreateRide).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/passenger/rides"),
    );
  });

  it("QUOTE_EXPIRED: informa expiração, pede nova cotação e não navega nem cria outra ride", async () => {
    mockUsePassenger.mockReturnValue({
      data: aliadoPassengerData,
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: quoteFixture,
    });
    mockConfirmRideQuote.mockRejectedValue(
      new ApiError(409, "Quote não pode ser confirmada", "QUOTE_EXPIRED"),
    );

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    fireEvent.click(
      await screen.findByRole("button", { name: "Confirmar corrida" }),
    );

    expect(await screen.findByText(/A cotação expirou/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Solicitar nova cotação" }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(mockPush).not.toHaveBeenCalledWith("/passenger/rides"),
    );
    expect(mockCreateRide).toHaveBeenCalledTimes(1);

    // Nova cotação devolve o formulário preservando os dados preenchidos
    fireEvent.click(
      screen.getByRole("button", { name: "Solicitar nova cotação" }),
    );
    expect(
      screen.getByRole("button", { name: "Criar corrida" }),
    ).toBeInTheDocument();
  });

  it("QUOTE_CONFLICT: recarrega o estado e permite confirmar novamente com a mesma rideId", async () => {
    mockUsePassenger.mockReturnValue({
      data: aliadoPassengerData,
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: quoteFixture,
    });
    mockConfirmRideQuote
      .mockRejectedValueOnce(
        new ApiError(409, "Quote não pode ser confirmada", "QUOTE_CONFLICT"),
      )
      .mockResolvedValueOnce({
        message: "Quote confirmada — primeira oferta emitida",
        ride: confirmedRideFixture,
        rideQuote: agreedQuoteFixture,
        firstOfferId: "offer_001",
      });

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    fireEvent.click(
      await screen.findByRole("button", { name: "Confirmar corrida" }),
    );

    expect(
      await screen.findByText(/O estado da cotação foi atualizado/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar corrida" }));

    await waitFor(() => expect(mockConfirmRideQuote).toHaveBeenCalledTimes(2));
    expect(mockConfirmRideQuote).toHaveBeenNthCalledWith(1, "ride_001");
    expect(mockConfirmRideQuote).toHaveBeenNthCalledWith(2, "ride_001");
    expect(mockCreateRide).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/passenger/rides"),
    );
  });

  it("ride sem quote (não-M1): mantém o comportamento clássico de navegação imediata", async () => {
    mockUsePassenger.mockReturnValue({
      data: {
        ...aliadoPassengerData,
        referredByDriverId: null,
        referredByDriver: null,
      },
      loading: false,
      error: null,
    });
    mockCreateRide.mockResolvedValue({
      message: "Corrida criada com sucesso",
      ride: rideFixture,
      quote: null,
      rideQuote: null,
    });

    render(<PassengerCreatePage />);
    await fillAndSubmitForm();

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/passenger/rides"),
    );
    expect(localStorage.getItem("passengerRideIds")).toBeNull();
    expect(mockConfirmRideQuote).not.toHaveBeenCalled();
  });
});
