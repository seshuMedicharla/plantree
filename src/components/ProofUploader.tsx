import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, Play, Plus, Trash2, Video } from 'lucide-react'
import Card from './Card'
import Pill from './Pill'

type ProofPayload = {
  video?: File
  photos: File[]
}

type ProofUploaderProps = {
  onChange: (payload: ProofPayload) => void
  required?: boolean
  initial?: { video?: File; photos?: File[] }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Unknown'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function ProofUploader({
  onChange,
  required = true,
  initial,
}: ProofUploaderProps) {
  const [video, setVideo] = useState<File | undefined>(initial?.video)
  const [photos, setPhotos] = useState<File[]>(initial?.photos?.slice(0, 3) ?? [])
  const [videoUrl, setVideoUrl] = useState<string | undefined>()
  const [videoDuration, setVideoDuration] = useState<number | undefined>()
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const videoCameraInputRef = useRef<HTMLInputElement | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    onChange({ video, photos })
  }, [onChange, photos, video])

  useEffect(() => {
    if (!video) {
      setVideoUrl(undefined)
      setVideoDuration(undefined)
      return
    }

    const url = URL.createObjectURL(video)
    setVideoUrl(url)
    setVideoDuration(undefined)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [video])

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPhotoUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  const hasLongVideo = useMemo(
    () => typeof videoDuration === 'number' && videoDuration > 90,
    [videoDuration]
  )

  const handlePickVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    if (!picked) return
    setVideo(picked)
    event.target.value = ''
  }

  const handlePickPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length === 0) return

    setPhotos((prev) => {
      const room = Math.max(0, 3 - prev.length)
      return [...prev, ...picked.slice(0, room)]
    })
    event.target.value = ''
  }

  const removeVideo = () => {
    setVideo(undefined)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          New Planting Post
        </p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">
          Capture proof
        </h3>
      </div>

      <div className="space-y-5 p-4">
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Reel video</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Record a short clip or select one from your gallery.
              </p>
            </div>
            <Pill text={video ? 'Ready' : 'Required'} className={video ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'} />
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handlePickVideo}
          />
          <input
            ref={videoCameraInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={handlePickVideo}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => videoCameraInputRef.current?.click()}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Video size={18} />
              Record Reel
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Play size={18} />
              Gallery
            </button>
          </div>

          {!video && required ? (
            <p className="text-xs text-amber-700">Reel required for verification.</p>
          ) : null}

          {video && videoUrl ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <video
                controls
                className="aspect-[4/5] w-full rounded-xl bg-black object-cover"
                src={videoUrl}
                onLoadedMetadata={(event) =>
                  setVideoDuration(event.currentTarget.duration)
                }
              />
              <p className="truncate text-xs font-medium text-slate-700">{video.name}</p>
              <div className="flex flex-wrap gap-2">
                <Pill text={formatBytes(video.size)} />
                <Pill text={`Duration ${formatDuration(videoDuration ?? 0)}`} />
              </div>
              {hasLongVideo ? (
                <Pill
                  text="Video is longer than 90s. Shorter clips verify faster."
                  className="border-amber-200 bg-amber-50 text-amber-700"
                />
              ) : null}
              <button
                type="button"
                onClick={removeVideo}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 size={16} />
                Remove Reel
              </button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Plant photos</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Capture live photos or choose existing images.
              </p>
            </div>
            <Pill text={`${photos.length}/3`} className={photos.length > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''} />
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePickPhotos}
          />
          <input
            ref={photoCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePickPhotos}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => photoCameraInputRef.current?.click()}
              disabled={photos.length >= 3}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera size={18} />
              Capture Photo
            </button>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photos.length >= 3}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus size={18} />
              Gallery
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((file, index) => (
                <div key={`${file.name}-${index}`} className="space-y-1">
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={photoUrls[index]}
                      alt={file.name}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="truncate text-[11px] text-slate-600" title={file.name}>
                    {file.name}
                  </p>
                </div>
              ))}
              {photos.length < 3 ? (
                <button
                  type="button"
                  onClick={() => photoCameraInputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500"
                  aria-label="Add another photo"
                >
                  <Plus size={20} />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Add supporting photos from site angles, sapling, and guard.
            </p>
          )}
        </section>
      </div>
    </Card>
  )
}
