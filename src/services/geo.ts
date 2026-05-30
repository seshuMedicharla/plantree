type LocationResult = {
  lat: number
  lon: number
  accuracy: number
  source?: 'gps' | 'ipgeolocation' | 'manual'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function ensureGeolocationAvailable() {
  if (!window.isSecureContext) {
    throw new Error('Mobile GPS requires HTTPS. Open the app on HTTPS or localhost, then try again.')
  }

  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported on this device.')
  }
}

function readGeoError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return new Error('Location access was denied. Please enable GPS permission and try again.')
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return new Error('GPS is allowed, but the device could not get a location fix. Turn on device Location/GPS and try outdoors or near a window.')
  }

  if (error.code === error.TIMEOUT) {
    return new Error('GPS request timed out. Keep Location/GPS on and try again near a window.')
  }

  return new Error(error.message || 'Could not fetch your location right now. Please try again.')
}

function readPosition(options: PositionOptions): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    try {
      ensureGeolocationAvailable()
    } catch (error) {
      reject(error)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
        })
      },
      (error) => {
        reject(readGeoError(error))
      },
      options
    )
  })
}

function watchHighAccuracyPosition(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    try {
      ensureGeolocationAvailable()
    } catch (error) {
      reject(error)
      return
    }

    let bestPosition: GeolocationPosition | undefined
    let lastError: GeolocationPositionError | undefined
    let settled = false
    let watchId: number | undefined

    const finish = (result?: LocationResult, error?: Error) => {
      if (settled) return

      settled = true
      window.clearTimeout(timeoutId)

      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }

      if (result) {
        resolve(result)
        return
      }

      reject(error ?? new Error('GPS request timed out. Keep Location/GPS on and try again.'))
    }

    const timeoutId = window.setTimeout(() => {
      if (bestPosition) {
        finish({
          lat: bestPosition.coords.latitude,
          lon: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
          source: 'gps',
        })
        return
      }

      finish(undefined, lastError ? readGeoError(lastError) : undefined)
    }, 45000)

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position
        }

        if (position.coords.accuracy <= 50) {
          finish({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
          })
        }
      },
      (error) => {
        lastError = error

        if (error.code === error.PERMISSION_DENIED) {
          finish(undefined, readGeoError(error))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 45000,
        maximumAge: 0,
      }
    )
  })
}

export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    return await watchHighAccuracyPosition()
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes('denied') &&
      !error.message.includes('HTTPS') &&
      'geolocation' in navigator &&
      window.isSecureContext
    ) {
      return readPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      })
    }

    throw error
  }
}

export async function getIpLocationFallback(): Promise<LocationResult> {
  const token = localStorage.getItem('auth_token')
  const response = await fetch(`${API_BASE_URL}/geo/ip-location`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'IP location lookup failed'
    throw new Error(message)
  }

  return payload as LocationResult
}

export async function getLocationPermissionState(): Promise<PermissionState | 'unsupported'> {
  if (!('permissions' in navigator)) return 'unsupported'

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unsupported'
  }
}
