import { API_URL } from "../config/api";
import { sanitizeDriverId } from "../utils/driverId";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const AUTH_STORAGE_KEY = "aliado:auth";
export const AUTH_TOKEN_STORAGE_KEY = "aliado:token";
export const AUTH_INVALIDATED_EVENT = "aliado:auth-invalidated";

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem("passengerId");
  localStorage.removeItem("driverId");
  // Legacy ride ids are not an ownership source and must not survive identity changes.
  localStorage.removeItem("passengerRideIds");
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const token =
    options.token ??
    (typeof window !== "undefined"
      ? (localStorage.getItem("aliado:token") ?? undefined)
      : undefined);
  const driverId = sanitizeDriverId(
    typeof window !== "undefined" ? localStorage.getItem("driverId") : null,
  );

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(driverId ? { "x-driver-id": driverId } : {}),
      ...(API_URL?.includes("ngrok")
        ? { "ngrok-skip-browser-warning": "true" }
        : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as unknown as T;
    }
  }

  if (!response.ok) {
    const errorBody = data as Record<string, unknown> | undefined;
    const raw =
      errorBody?.message ??
      errorBody?.error ??
      (typeof data === "string" ? data : response.statusText);
    const message = typeof raw === "string" ? raw : response.statusText;
    const code =
      typeof errorBody?.code === "string" ? errorBody.code : undefined;

    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !endpoint.startsWith("/auth/")
    ) {
      clearStoredAuth();
      window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
    }

    throw new ApiError(response.status, message, code);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string) => apiRequest<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    apiRequest<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    apiRequest<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string) =>
    apiRequest<T>(path, { method: "DELETE", token }),
};
