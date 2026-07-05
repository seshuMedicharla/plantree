import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MapPin, PenLine, Trees } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Pill from '../components/Pill'
import ProofUploader from '../components/ProofUploader'
import Toast from '../components/Toast'
import useToast from '../components/useToast'
import { checkSpotAvailability, submitPlanting } from '../services/api'
import { getCurrentLocation, getIpLocationFallback } from '../services/geo'

type LocationState = {
  lat: number
  lon: number
  accuracy: number
  source?: 'gps' | 'ipgeolocation' | 'manual'
}

type AvailabilityState = 'unknown' | 'available' | 'blocked'
type PostRouteState = {
  initialPhoto?: File
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export default function Post() {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const initialPhotoRef = useRef<File | undefined>(
    (routeLocation.state as PostRouteState | null)?.initialPhoto instanceof File
      ? (routeLocation.state as PostRouteState).initialPhoto
      : undefined
  )
  const [treeCount, setTreeCount] = useState('1')
  const [species, setSpecies] = useState('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState<LocationState | null>(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [proofVideo, setProofVideo] = useState<File | undefined>()
  const [proofPhotos, setProofPhotos] = useState<File[]>(() =>
    initialPhotoRef.current ? [initialPhotoRef.current] : []
  )
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityState>('unknown')
  const [blockReason, setBlockReason] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [uploaderKey, setUploaderKey] = useState(0)

  const { toast, showToast, dismissToast } = useToast()

  useEffect(() => {
    if (!initialPhotoRef.current) return

    showToast('success', 'Photo captured. Add a reel, GPS, and details to finish.')
    navigate('/post', { replace: true, state: null })
  }, [navigate, showToast])

  const handleCaptureGPS = async () => {
    setCapturingLocation(true)

    try {
      const coords = await getCurrentLocation()
      setLocation(coords)
      setAvailability('unknown')
      setBlockReason(undefined)
      showToast('success', 'GPS captured successfully.')
    } catch (error) {
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
        const radiusCm = result.radiusCm ?? 100
        setAvailability('available')
        showToast('success', `Spot is clear within ${radiusCm}cm. You can submit now.`)
      } else {
        setAvailability('blocked')
        const details = result.nearestDistanceCm
          ? `${result.reason ?? 'Spot is not available.'} (nearest plant at ${result.nearestDistanceCm}cm)`
          : result.reason
        setBlockReason(details)
        showToast('error', details ?? 'Spot is not available.')
      }
    } catch (error) {
      setAvailability('unknown')
      showToast(
        'error',
        error instanceof Error ? error.message : 'Could not check spot availability. Try again.'
      )
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async () => {
    if (!location) return

    setSubmitting(true)

    try {
      if (availability !== 'available') {
        const checkResult = await checkSpotAvailability(location.lat, location.lon)

        if (!checkResult.available) {
          const details = checkResult.nearestDistanceCm
            ? `${checkResult.reason ?? 'Spot is not available.'} (nearest plant at ${checkResult.nearestDistanceCm}cm)`
            : checkResult.reason ?? 'Spot is not available.'
          setAvailability('blocked')
          setBlockReason(details)
          showToast('error', details)
          return
        }

        setAvailability('available')
      }

      const media = await Promise.all(
        [
          ...(proofVideo
            ? [
                {
                  type: 'video' as const,
                  file: proofVideo,
                },
              ]
            : []),
          ...proofPhotos.map((file) => ({
            type: 'photo' as const,
            file,
          })),
        ].map(async (item) => ({
          type: item.type,
          name: item.file.name,
          mimeType: item.file.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
          dataUrl: await fileToDataUrl(item.file),
        }))
      )

      const result = await submitPlanting({
        count: Math.max(1, Number.parseInt(treeCount || '1', 10)),
        species,
        caption,
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy,
        photosCount: proofPhotos.length,
        hasVideo: Boolean(proofVideo),
        media,
      })

      if (result.ok) {
        showToast('success', `Posted successfully (${result.id}).`)
        setTreeCount('1')
        setSpecies('')
        setCaption('')
        setLocation(null)
        setProofVideo(undefined)
        setProofPhotos([])
        setAvailability('unknown')
        setBlockReason(undefined)
        setUploaderKey((current) => current + 1)
      } else {
        showToast('error', result.message)
      }
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : 'Post failed. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const canCheckSpot = Boolean(location)
  const canSubmit = Boolean(location && proofVideo && proofPhotos.length > 0)
  const stepClass = (ready: boolean) =>
    ready
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-white text-slate-500'

  return (
    <section className="space-y-4">
      <Toast toast={toast} onDismiss={dismissToast} />

      <div className="space-y-4 px-4 pb-4">
        <Card className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Create
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">New planting post</h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture media first, then add details and submit for verification.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-2xl border px-3 py-2 ${stepClass(Boolean(proofVideo && proofPhotos.length > 0))}`}>
              <CheckCircle2 size={17} />
              <p className="mt-1 text-xs font-semibold">Media</p>
            </div>
            <div className={`rounded-2xl border px-3 py-2 ${stepClass(Boolean(location))}`}>
              <MapPin size={17} />
              <p className="mt-1 text-xs font-semibold">GPS</p>
            </div>
            <div className={`rounded-2xl border px-3 py-2 ${stepClass(availability === 'available')}`}>
              <Trees size={17} />
              <p className="mt-1 text-xs font-semibold">Radius</p>
            </div>
          </div>
        </Card>

        <ProofUploader
          key={uploaderKey}
          initial={
            initialPhotoRef.current
              ? { photos: [initialPhotoRef.current] }
              : undefined
          }
          onChange={(payload) => {
            setProofVideo(payload.video)
            setProofPhotos(payload.photos)
            setAvailability('unknown')
            setBlockReason(undefined)
          }}
        />

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <PenLine size={18} className="text-emerald-600" />
              <h3 className="text-base font-semibold">Post details</h3>
            </div>

            <div className="grid grid-cols-[0.7fr_1.3fr] gap-2">
              <Input
                type="number"
                min={1}
                value={treeCount}
                onChange={(event) => setTreeCount(event.target.value)}
                placeholder="Trees"
              />
              <Input
                type="text"
                value={species}
                onChange={(event) => setSpecies(event.target.value)}
                placeholder="Species"
              />
            </div>

            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={240}
              placeholder="Write a caption..."
              className="min-h-24 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
            />
            <p className="text-right text-xs text-slate-400">{caption.length}/240</p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Capture GPS</p>
              <Button variant="secondary" onClick={handleCaptureGPS} disabled={capturingLocation}>
                {capturingLocation ? 'Capturing...' : 'Capture Location'}
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
          </div>
        </Card>

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
              {submitting ? 'Posting...' : 'Post Planting'}
            </Button>

            {!canSubmit ? (
              <Pill text="GPS, reel, and at least one photo are required" />
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  )
}
