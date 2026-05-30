import { Router } from 'express'
import { config } from '../config.js'

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

export default router
