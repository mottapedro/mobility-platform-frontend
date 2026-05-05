import { apiRequest } from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: 'passenger' | 'driver'
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'passenger' | 'driver'
  }
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest('/auth/login', { method: 'POST', body: payload })
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest('/auth/register', { method: 'POST', body: payload })
}
