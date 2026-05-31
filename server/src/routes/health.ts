import { Router } from 'express'
import { config } from '../config.js'
import { getMongoDb } from '../mongo.js'

const router = Router()

function describeDatabaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Database connection failed.'
  }

  const details = [
    error.name,
    'code' in error ? String(error.code) : '',
    'codeName' in error ? String(error.codeName) : '',
    error.message,
  ]
    .filter(Boolean)
    .join(' ')

  if (/bad auth|authentication failed/i.test(details)) {
    return 'Database authentication failed. Check MONGODB_URI username and password in Render.'
  }

  if (/ENOTFOUND|querySrv|ServerSelection|network|timed out/i.test(details)) {
    return 'Database connection failed. Check MongoDB Atlas Network Access and cluster hostname.'
  }

  if (/Invalid scheme|MongoParseError|URI|connection string/i.test(details)) {
    return 'Database connection string is invalid. Check the MONGODB_URI value in Render.'
  }

  return `Database connection failed: ${details}`
}

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

router.get('/health/db', async (_request, response) => {
  try {
    const db = await getMongoDb()
    await db.command({ ping: 1 })
    response.json({ ok: true, database: 'connected' })
  } catch (error) {
    response.status(503).json({
      ok: false,
      message: describeDatabaseError(error),
    })
  }
})

export default router
