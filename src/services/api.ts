import { API_URL } from '../config/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let data: T | undefined
  if (text) {
    try {
      data = JSON.parse(text) as T
    } catch {
      data = text as unknown as T
    }
  }

  if (!response.ok) {
    const message =
      (data as Record<string, string>)?.message ??
      (data as Record<string, string>)?.error ??
      (typeof data === 'string' ? data : response.statusText)
    throw new ApiError(response.status, message)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, token?: string) => apiRequest<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string) => apiRequest<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body: unknown, token?: string) => apiRequest<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string) => apiRequest<T>(path, { method: 'DELETE', token }),
}
