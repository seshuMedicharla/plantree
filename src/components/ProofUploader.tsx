import { useEffect, useMemo, useRef, useState } from 'react'
import Button from './Button'
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
  const photoInputRef = useRef<HTMLInputElement | null>(null)

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
  }

  const handlePickPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length === 0) return

    setPhotos((prev) => {
      const room = Math.max(0, 3 - prev.length)
      return [...prev, ...picked.slice(0, room)]
    })
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
    <Card>
      <h3 className="text-sm font-semibold text-slate-900">Proof</h3>

      <div className="mt-4 space-y-4">
        <section className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Upload Reel (15-60s recommended)
          </p>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handlePickVideo}
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => videoInputRef.current?.click()}
          >
            {video ? 'Replace Reel' : 'Choose Reel'}
          </Button>

          {!video && required ? (
            <p className="text-xs text-amber-700">Reel required for verification</p>
          ) : null}

          {video && videoUrl ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <video
                controls
                className="w-full rounded-xl"
                src={videoUrl}
                onLoadedMetadata={(event) =>
                  setVideoDuration(event.currentTarget.duration)
                }
              />
              <p className="text-xs text-slate-700">{video.name}</p>
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
              <Button type="button" variant="ghost" onClick={removeVideo}>
                Remove Reel
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Upload Photos (up to 3)</p>
            <Pill text={`${photos.length}/3`} />
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePickPhotos}
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => photoInputRef.current?.click()}
            disabled={photos.length >= 3}
          >
            Add Photos
          </Button>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((file, index) => (
                <div key={`${file.name}-${index}`} className="space-y-1">
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={photoUrls[index]}
                      alt={file.name}
                      className="h-20 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="truncate text-[11px] text-slate-600" title={file.name}>
                    {file.name}
                  </p>
                </div>
              ))}
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
