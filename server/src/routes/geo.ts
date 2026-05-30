import { Router } from 'express'
import { requireAuth } from '../auth/access.js'
import { config } from '../config.js'

type IpGeolocationResponse = {
  latitude?: string
  longitude?: string
  location?: {
    latitude?: string
    longitude?: string
  }
  message?: string
}

const router = Router()

router.get('/geo/ip-location', async (request, response, next) => {
  try {
    const user = requireAuth(request, response)
    if (!user) return

    if (!config.ipGeolocationApiKey) {
      response.status(503).json({ message: 'IPGEOLOCATION_API_KEY is not configured' })
      return
    }

    const apiUrl = new URL('https://api.ipgeolocation.io/v3/ipgeo')
    apiUrl.searchParams.set('apiKey', config.ipGeolocationApiKey)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const geoResponse = await fetch(apiUrl, { signal: controller.signal }).finally(() => {
      clearTimeout(timeoutId)
    })
    const payload = (await geoResponse.json().catch(() => null)) as IpGeolocationResponse | null

    if (!geoResponse.ok || !payload) {
      response.status(502).json({ message: payload?.message ?? 'IP location lookup failed' })
      return
    }

    const lat = Number.parseFloat(payload.location?.latitude ?? payload.latitude ?? '')
    const lon = Number.parseFloat(payload.location?.longitude ?? payload.longitude ?? '')

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      response.status(502).json({ message: 'IP location lookup did not return coordinates' })
      return
    }

    response.json({
      lat,
      lon,
      accuracy: 50000,
      source: 'ipgeolocation',
    })
  } catch (error) {
    next(error)
  }
})

export default router
