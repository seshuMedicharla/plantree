export type CheckSpotRequest = {
  lat: number
  lon: number
  radiusCm: number
}

export type CheckSpotResponse = {
  available: boolean
  reason?: string
  nearestDistanceCm?: number
  existingPlantId?: string
  radiusCm?: number
}

export type SubmitPlantingRequest = {
  count: number
  species: string
  lat: number
  lon: number
  accuracy: number
  hasVideo: boolean
  photosCount: number
  media?: Array<{
    type: 'photo' | 'video'
    name: string
    mimeType: string
    dataUrl: string
  }>
}

export type SubmitPlantingResponse = {
  ok: boolean
  id?: string
  message: string
  nearestDistanceCm?: number
  existingPlantId?: string
  radiusCm?: number
}
