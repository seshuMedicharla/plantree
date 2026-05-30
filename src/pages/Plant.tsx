import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Pill from '../components/Pill'
import ProofUploader from '../components/ProofUploader'
import Toast from '../components/Toast'
import useToast from '../components/useToast'
import { checkSpotAvailability, submitPlanting } from '../services/api'
import { getCurrentLocation, getIpLocationFallback, getLocationPermissionState } from '../services/geo'

type LocationState = {
  lat: number
  lon: number
  accuracy: number
  source?: 'gps' | 'ipgeolocation' | 'manual'
}

type AvailabilityState = 'unknown' | 'available' | 'blocked'

export default function Plant() {
  const [treeCount, setTreeCount] = useState('1')
  const [species, setSpecies] = useState('')
  const [location, setLocation] = useState<LocationState | null>(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [proofVideo, setProofVideo] = useState<File | undefined>()
  const [proofPhotos, setProofPhotos] = useState<File[]>([])
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityState>('unknown')
  const [blockReason, setBlockReason] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [uploaderKey, setUploaderKey] = useState(0)
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unsupported'>('unsupported')

  const { toast, showToast, dismissToast } = useToast()

  useEffect(() => {
    void getLocationPermissionState().then(setLocationPermission)
  }, [])

  const handleCaptureGPS = async () => {
    setCapturingLocation(true)
    const permissionState = await getLocationPermissionState()
    setLocationPermission(permissionState)

    if (permissionState === 'denied') {
      showToast(
        'error',
        'Location is blocked for this site. Allow Location from the address bar, then reload.'
      )
      setCapturingLocation(false)
      return
    }

    try {
      const coords = await getCurrentLocation()
      setLocation(coords)
      setLocationPermission(await getLocationPermissionState())
      setAvailability('unknown')
      setBlockReason(undefined)
      showToast('success', 'GPS captured successfully.')
    } catch (error) {
      setLocationPermission(await getLocationPermissionState())
      try {
        const coords = await getIpLocationFallback()
        setLocation(coords)
        setAvailability('unknown')
        setBlockReason(undefined)
        showToast('success', 'Approximate IP location added. Mobile GPS is more accurate.')
      } catch {
        showToast(
          'error',
          error instanceof Error ? error.message : 'Unable to capture location.'
        )
      }
    } finally {
      setCapturingLocation(false)
    }
  }

  const handleUseManualLocation = () => {
    const lat = Number.parseFloat(manualLat)
    const lon = Number.parseFloat(manualLon)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      showToast('error', 'Enter a valid latitude between -90 and 90.')
      return
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      showToast('error', 'Enter a valid longitude between -180 and 180.')
      return
    }

    setLocation({ lat, lon, accuracy: 25, source: 'manual' })
    setAvailability('unknown')
    setBlockReason(undefined)
    showToast('success', 'Manual location added.')
  }

  const handleCheckAvailability = async () => {
    if (!location) return

    setChecking(true)
    setAvailability('unknown')
    setBlockReason(undefined)

    try {
      const result = await checkSpotAvailability(location.lat, location.lon)
      if (result.available) {
        setAvailability('available')
        showToast('success', 'Spot is available. You can submit now.')
      } else {
        setAvailability('blocked')
        setBlockReason(result.reason)
        showToast('error', result.reason ?? 'Spot is not available.')
      }
    } catch {
      setAvailability('unknown')
      showToast('error', 'Could not check spot availability. Try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async () => {
    if (!location || !proofVideo || availability !== 'available') return

    setSubmitting(true)

    try {
      const result = await submitPlanting({
        count: Math.max(1, Number.parseInt(treeCount || '1', 10)),
        species,
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy,
        photosCount: proofPhotos.length,
        hasVideo: Boolean(proofVideo),
      })

      if (result.ok) {
        showToast('success', `Submitted successfully (${result.id}).`)
        setTreeCount('1')
        setSpecies('')
        setLocation(null)
        setProofVideo(undefined)
        setProofPhotos([])
        setAvailability('unknown')
        setBlockReason(undefined)
        setUploaderKey((current) => current + 1)
      } else {
        showToast('error', result.message)
      }
    } catch {
      showToast('error', 'Submit failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canCheckSpot = Boolean(location && proofVideo)
  const canSubmit = Boolean(location && proofVideo && availability === 'available')

  return (
    <section className="space-y-4">
      <Toast toast={toast} onDismiss={dismissToast} />

      <div className="space-y-4 px-4 pb-4">
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-700">Plant Entry</p>
          <div className="space-y-3">
            <Input
              type="number"
              min={1}
              value={treeCount}
              onChange={(event) => setTreeCount(event.target.value)}
              placeholder="Tree count"
            />
            <Input
              type="text"
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
              placeholder="Species"
            />

            <Button variant="secondary" onClick={handleCaptureGPS} disabled={capturingLocation}>
              {capturingLocation
                ? 'Capturing...'
                : locationPermission === 'denied'
                  ? 'Location Blocked'
                  : 'Capture GPS'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="any"
                value={manualLat}
                onChange={(event) => setManualLat(event.target.value)}
                placeholder="Latitude"
              />
              <Input
                type="number"
                step="any"
                value={manualLon}
                onChange={(event) => setManualLon(event.target.value)}
                placeholder="Longitude"
              />
            </div>
            <Button variant="ghost" onClick={handleUseManualLocation}>
              Use Coordinates
            </Button>

            {locationPermission === 'denied' ? (
              <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
                Location is blocked in Chrome. Click the site icon in the address bar, allow
                Location, reload, then capture GPS again.
              </p>
            ) : null}

            {location ? (
              <div className="space-y-1 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                <p>Lat: {location.lat.toFixed(6)}</p>
                <p>Lon: {location.lon.toFixed(6)}</p>
                <p>Accuracy: {Math.round(location.accuracy)}m</p>
                {location.source === 'gps' ? (
                  <p className="text-emerald-700">GPS location captured.</p>
                ) : null}
                {location.source === 'ipgeolocation' ? (
                  <p className="text-amber-700">Approximate IP location. Use mobile GPS for accuracy.</p>
                ) : null}
                {location.source === 'manual' ? (
                  <p className="text-amber-700">Manual coordinates entered. Use mobile GPS for accuracy.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        <ProofUploader
          key={uploaderKey}
          required
          onChange={(payload) => {
            setProofVideo(payload.video)
            setProofPhotos(payload.photos)
            setAvailability('unknown')
            setBlockReason(undefined)
          }}
        />

        {canCheckSpot ? (
          <Card>
            <Button
              variant="secondary"
              onClick={handleCheckAvailability}
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Check 1m Availability'}
            </Button>

            {availability === 'available' ? (
              <p className="mt-2 text-sm text-emerald-700">Spot available for planting.</p>
            ) : null}

            {availability === 'blocked' ? (
              <p className="mt-2 text-sm text-rose-700">
                {blockReason ?? 'Already planted within 1m radius'}
              </p>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Trees: {Math.max(1, Number.parseInt(treeCount || '1', 10))} • GPS:{' '}
              {location ? 'ok' : 'missing'} • Reel: {proofVideo ? 'ok' : 'missing'} • Photos:{' '}
              {proofPhotos.length} • Spot: {availability}
            </p>

            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>

            {!canSubmit ? (
              <Pill text="GPS + Reel + Available spot required before submit" />
            ) : null}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Verification Guidance</h3>
          <p className="mt-2 text-sm text-slate-600">
            One planting per 1 meter radius is enforced by backend.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            We capture high accuracy GPS and proof media.
          </p>
        </Card>
      </div>
    </section>
  )
}
