import { apiPost } from './http'
import type { AuthUser } from './http'

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type RegisterVerifyResponse = {
  ok: boolean
  message: string
  user: AuthUser
}

export type RegisterAccountPayload = {
  name: string
  username: string
  email: string
  village: string
  mandal: string
  district: string
  state: string
  password: string
}

export function createAccount(payload: RegisterAccountPayload) {
  return apiPost<RegisterVerifyResponse>('/auth/register', {
    name: payload.name,
    username: payload.username,
    email: payload.email,
    village: payload.village,
    mandal: payload.mandal,
    district: payload.district,
    state: payload.state,
    password: payload.password,
  })
}

export function loginWithCredentials(username: string, password: string) {
  return apiPost<AuthResponse>('/auth/login', { username, password })
}
