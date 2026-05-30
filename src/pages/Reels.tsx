import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import ReelPlayer from '../components/ReelPlayer'
import useVideoAutoPlay from '../hooks/useVideoAutoPlay'
import { fetchReels } from '../services/backendApi'
import type { Reel } from '../services/types'

type ReelFilter = 'all' | 'negative' | 'following'

const filterTabs: Array<{ key: ReelFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'negative', label: 'Negative' },
  { key: 'following', label: 'Following' },
]

const viewportHeight = 'calc(100vh - 9.5rem)'
const fallbackVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export default function Reels() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])

  const [filter, setFilter] = useState<ReelFilter>('all')
  const [reels, setReels] = useState<Reel[]>([])

  useEffect(() => {
    let active = true

    fetchReels()
      .then((payload) => {
        if (active) {
          setReels(payload.reels)
        }
      })
      .catch(() => {
        if (active) {
          setReels([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  const filteredReels = useMemo(() => {
    if (filter === 'negative') {
      return reels.filter((reel) => reel.zoneTag === 'NEGATIVE')
    }

    if (filter === 'following') {
      return reels.filter((reel) => ['Seshu', 'Priya'].includes(reel.user.name))
    }

    return reels
  }, [filter])

  videoRefs.current = []

  const activeIndex = useVideoAutoPlay({
    containerRef,
    videosRef: videoRefs,
    threshold: 0.6,
  })

  if (filteredReels.length === 0) {
    return (
      <section className="px-3 pt-3">
        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">No reels found</h2>
          <p className="text-sm text-slate-600">
            Try another filter or create a new planting proof reel.
          </p>
          <Button onClick={() => navigate('/plant')}>Plant now</Button>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-md px-3 pt-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 p-1 shadow-sm">
        <div
          className="pointer-events-none absolute inset-x-2 top-1 h-1.5 rounded-full opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 5px, transparent 5px 13px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-2 bottom-1 h-1.5 rounded-full opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 5px, transparent 5px 13px)',
          }}
        />

        <div className="relative grid grid-cols-3 gap-1 p-1">
          <div
            className="absolute bottom-1 left-1 top-1 rounded-xl bg-emerald-100/95 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.45),inset_0_4px_10px_rgba(255,255,255,0.35)] transition-transform duration-300"
            style={{
              width: 'calc((100% - 0.5rem) / 3)',
              transform: `translateX(${filterTabs.findIndex((item) => item.key === filter) * 100}%)`,
            }}
          />

          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilter(tab.key)
                containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`relative z-10 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
                filter === tab.key ? 'text-emerald-800' : 'text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-500">
          Reel {Math.min(activeIndex + 1, filteredReels.length)} of {filteredReels.length}
        </p>
      </div>

      <div className="relative mt-3" style={{ height: viewportHeight }}>
        <div
          ref={containerRef}
          className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-3xl"
        >
          {filteredReels.map((reel, index) => (
            <div
              key={reel.id}
              className="snap-start"
              style={{ minHeight: viewportHeight, height: viewportHeight }}
            >
              <ReelPlayer
                videoUrl={reel.videoUrl ?? fallbackVideo}
                caption={reel.caption}
                user={reel.user.name}
                place={reel.user.place}
                trees={reel.trees}
                zoneTag={reel.zoneTag}
                videoRef={(element) => {
                  videoRefs.current[index] = element
                }}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute right-1 top-3 flex h-[calc(100%-1.5rem)] w-2 flex-col justify-center gap-2">
          {filteredReels.map((reel, index) => (
            <div
              key={reel.id}
              className={`h-6 w-full rounded-full transition-colors ${
                index === activeIndex ? 'bg-emerald-400' : 'bg-slate-300/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
