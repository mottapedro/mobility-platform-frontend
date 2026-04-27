// Auth service — ready to connect when a real endpoint is available.
// AuthContext currently uses mock auth; swap the calls below when the backend is ready.
import { api } from './api'

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
  return api.post('/auth/login', payload)
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  return api.post('/auth/register', payload)
}
