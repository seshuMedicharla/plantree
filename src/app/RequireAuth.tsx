import { Navigate, Outlet } from 'react-router-dom'
import { getAuthToken, getAuthUser } from '../services/http'

export function RequireAuth() {
  return getAuthToken() ? <Outlet /> : <Navigate to="/auth" replace />
}

export function RequireAdmin() {
  const user = getAuthUser()

  if (!getAuthToken()) {
    return <Navigate to="/auth" replace />
  }

  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
