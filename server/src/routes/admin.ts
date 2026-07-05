import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { requireAdmin } from '../auth/access.js'
import { hashPassword } from '../auth/password.js'
import { collection } from '../mongo.js'
import type {
  NotificationDocument,
  PlantingDocument,
  PlantingStatus,
  UserDocument,
} from '../models.js'

const router = Router()

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})
const resetPasswordSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
})

const rejectPlantingSchema = z.object({
  reason: z.string().trim().min(3).max(300),
})

async function toAdminPlanting(planting: PlantingDocument) {
  const users = await collection<UserDocument>('users')
  const user = await users.findOne({ _id: planting.userId })

  return {
    id: planting._id,
    user: {
      id: planting.userId,
      name: user?.name ?? 'PlanTree User',
      username: user?.username ?? null,
    },
    species: planting.species,
    count: planting.count,
    location: {
      lat: planting.latitude,
      lon: planting.longitude,
      accuracy: planting.accuracy,
    },
    status: planting.status,
    rejectionReason: planting.rejectionReason ?? null,
    createdAt: planting.createdAt.toISOString(),
    media: planting.media ?? [],
  }
}

router.get('/admin/plantings', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const status = String(request.query.status ?? 'PENDING').toUpperCase()
    const allowedStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'ALL']
    const selectedStatus = allowedStatuses.includes(status) ? status : 'PENDING'
    const plantings = await collection<PlantingDocument>('plantings')
    const filter =
      selectedStatus === 'ALL' ? {} : { status: selectedStatus as PlantingStatus }
    const rows = await plantings.find(filter).sort({ createdAt: -1 }).limit(100).toArray()

    response.json({ plantings: await Promise.all(rows.map(toAdminPlanting)) })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/plantings/:id/verify', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const plantings = await collection<PlantingDocument>('plantings')
    const users = await collection<UserDocument>('users')
    const notifications = await collection<NotificationDocument>('notifications')
    const now = new Date()
    const planting = await plantings.findOneAndUpdate(
      { _id: request.params.id, status: 'PENDING' },
      {
        $set: {
          status: 'VERIFIED',
          rejectionReason: undefined,
          verifiedBy: admin.sub,
          verifiedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    if (!planting) {
      response.status(404).json({ message: 'Pending planting not found' })
      return
    }

    await users.updateOne(
      { _id: planting.userId },
      {
        $inc: {
          plantedTreesCount: planting.count,
          impactScore: planting.count * 10,
        },
        $addToSet: { badges: 'badge-first-tree' },
        $set: { updatedAt: now },
      }
    )

    await notifications.insertOne({
      _id: randomUUID(),
      userId: planting.userId,
      title: 'Planting verified',
      body: 'Your planting proof has been verified.',
      read: false,
      createdAt: now,
    })

    response.json({ message: 'Planting verified', plantingId: planting._id })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/plantings/:id/reject', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const payload = rejectPlantingSchema.parse(request.body)
    const plantings = await collection<PlantingDocument>('plantings')
    const notifications = await collection<NotificationDocument>('notifications')
    const now = new Date()
    const planting = await plantings.findOneAndUpdate(
      { _id: request.params.id, status: 'PENDING' },
      {
        $set: {
          status: 'REJECTED',
          rejectionReason: payload.reason,
          verifiedBy: admin.sub,
          verifiedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    if (!planting) {
      response.status(404).json({ message: 'Pending planting not found' })
      return
    }

    await notifications.insertOne({
      _id: randomUUID(),
      userId: planting.userId,
      title: 'Planting rejected',
      body: payload.reason,
      read: false,
      createdAt: now,
    })

    response.json({ message: 'Planting rejected', plantingId: planting._id })
  } catch (error) {
    next(error)
  }
})

router.get('/admin/users', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const users = await collection<UserDocument>('users')
    const rows = await users.find().sort({ createdAt: -1 }).limit(100).toArray()

    response.json({
      users: rows.map((user) => ({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/users/:id/role', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const payload = updateRoleSchema.parse(request.body)

    if (request.params.id === admin.sub && payload.role !== 'ADMIN') {
      response.status(400).json({ message: 'You cannot remove your own admin role' })
      return
    }

    const users = await collection<UserDocument>('users')
    const user = await users.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { role: payload.role, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!user) {
      response.status(404).json({ message: 'User not found' })
      return
    }

    response.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/users/reset-password', async (request, response, next) => {
  try {
    const admin = requireAdmin(request, response)
    if (!admin) return

    const payload = resetPasswordSchema.parse(request.body)
    const identifier = payload.identifier.trim().toLowerCase()
    const users = await collection<UserDocument>('users')
    const user = await users.findOneAndUpdate(
      {
        $or: [{ username: identifier }, { email: identifier }],
      },
      {
        $set: {
          passwordHash: hashPassword(payload.password),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!user) {
      response.status(404).json({ message: 'User not found' })
      return
    }

    response.json({
      message: 'Password reset successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
