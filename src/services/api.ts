import { apiPost } from './http'
import type {
  CheckSpotRequest,
  CheckSpotResponse,
  SubmitPlantingRequest,
  SubmitPlantingResponse,
} from './dto'

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_API as string | undefined) === 'true'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function randomDelay() {
  return 700 + Math.floor(Math.random() * 501)
}

export async function checkSpotAvailability(
  lat: number,
  lon: number,
  radiusCm = 100
): Promise<CheckSpotResponse> {
  if (USE_MOCK) {
    await sleep(randomDelay())

    const available = Math.random() < 0.7
    if (available) return { available: true }

    return {
      available: false,
      reason: `Already planted within ${radiusCm}cm radius`,
      nearestDistanceCm: Math.floor(Math.random() * radiusCm) + 1,
      existingPlantId: `plant-${1000 + Math.floor(Math.random() * 9000)}`,
    }
  }

  const payload: CheckSpotRequest = { lat, lon, radiusCm }
  return apiPost<CheckSpotResponse>('/plantings/check-spot', payload)
}

export async function submitPlanting(
  payload: SubmitPlantingRequest
): Promise<SubmitPlantingResponse> {
  if (USE_MOCK) {
    await sleep(randomDelay())

    return {
      ok: true,
      id: `plant-${Date.now()}`,
      message: 'Planting submitted successfully',
    }
  }

  return apiPost<SubmitPlantingResponse>('/plantings', payload)
}
