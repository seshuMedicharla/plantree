import { apiGet, apiPost } from './http'

export type AdminPlanting = {
  id: string
  user: {
    id: string
    name: string
    username: string | null
  }
  species: string
  count: number
  location: {
    lat: number
    lon: number
    accuracy: number
  }
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  rejectionReason: string | null
  createdAt: string
  media: Array<{ id: string; type: 'photo' | 'video'; url: string }>
}

export type AdminUser = {
  id: string
  name: string
  username: string | null
  email: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export function fetchAdminPlantings(status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL' = 'PENDING') {
  return apiGet<{ plantings: AdminPlanting[] }>(`/admin/plantings?status=${status}`)
}

export function verifyAdminPlanting(plantingId: string) {
  return apiPost<{ message: string; plantingId: string }>(`/admin/plantings/${plantingId}/verify`)
}

export function rejectAdminPlanting(plantingId: string, reason: string) {
  return apiPost<{ message: string; plantingId: string }>(`/admin/plantings/${plantingId}/reject`, {
    reason,
  })
}

export function fetchAdminUsers() {
  return apiGet<{ users: AdminUser[] }>('/admin/users')
}

export function updateAdminUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return apiPost<{ user: AdminUser }>(`/admin/users/${userId}/role`, { role })
}
