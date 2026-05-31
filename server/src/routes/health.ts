import { Router } from 'express'
import { config } from '../config.js'
import { getMongoDb } from '../mongo.js'

const router = Router()

router.get('/api', (_request, response) => {
  response.json({
    ok: true,
    name: 'PlanTree API',
    endpoints: ['/health', '/auth/register', '/auth/login', '/posts', '/plantings'],
  })
})

router.get('/health', (_request, response) => {
  response.json({
    ok: true,
    database: config.mongoUri ? 'mongodb_configured' : 'mongodb_not_configured',
  })
})

router.get('/health/db', async (_request, response, next) => {
  try {
    const db = await getMongoDb()
    await db.command({ ping: 1 })
    response.json({ ok: true, database: 'connected' })
  } catch (error) {
    next(error)
  }
})

export default router
