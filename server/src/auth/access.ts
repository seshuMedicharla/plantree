import type { Request, Response } from 'express'
import { getRequestUser, type JwtPayload, type UserRole } from './jwt.js'

export function requireAuth(request: Request, response: Response): JwtPayload | null {
  const user = getRequestUser(request)

  if (!user) {
    response.status(401).json({ message: 'Login required' })
    return null
  }

  return user
}

export function requireRole(
  request: Request,
  response: Response,
  allowedRoles: UserRole[]
): JwtPayload | null {
  const user = requireAuth(request, response)

  if (!user) return null

  if (!allowedRoles.includes(user.role)) {
    response.status(403).json({ message: 'Access denied' })
    return null
  }

  return user
}

export function requireAdmin(request: Request, response: Response) {
  return requireRole(request, response, ['ADMIN'])
}
