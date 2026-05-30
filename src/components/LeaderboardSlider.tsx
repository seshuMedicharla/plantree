import { useEffect, useState } from 'react'
import Card from './Card'
import { fetchLeaderboard, type LeaderboardScope } from '../services/backendApi'
import type { LeaderRow } from '../services/types'

type SlideConfig = {
  title: string
  scope: LeaderboardScope
}

const slideConfigs: SlideConfig[] = [
  {
    title: 'Village Leaders',
    scope: 'village',
  },
  {
    title: 'Mandal Leaders',
    scope: 'mandal',
  },
  {
    title: 'District Leaders',
    scope: 'district',
  },
  {
    title: 'State Leaders',
    scope: 'state',
  },
]

const medalByRank: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

type LeaderboardSlide = SlideConfig & {
  data: LeaderRow[]
  myRow?: LeaderRow
}

export default function LeaderboardSlider() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [openMyRow, setOpenMyRow] = useState<string | null>(null)
  const [expandedSlide, setExpandedSlide] = useState(false)
  const [slides, setSlides] = useState<LeaderboardSlide[]>(
    slideConfigs.map((config) => ({ ...config, data: [] }))
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all(
      slideConfigs.map(async (config) => {
        const payload = await fetchLeaderboard(config.scope)
        return {
          ...config,
          data: payload.rows,
          myRow: payload.myRow,
        }
      })
    )
      .then((nextSlides) => {
        if (active) setSlides(nextSlides)
      })
      .catch(() => {
        if (active) setSlides(slideConfigs.map((config) => ({ ...config, data: [] })))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (expandedSlide) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [expandedSlide, slides.length])

  const activeSlide = slides[activeIndex]
  const myRow = activeSlide.myRow ?? activeSlide.data.find((row) => row.isMe)
  const isMyRowOpen = openMyRow === activeSlide.title
  const visibleRows = expandedSlide ? activeSlide.data : activeSlide.data.slice(0, 3)

  return (
    <div>
      <style>{`@keyframes leaderboard-slide-in{0%{opacity:0;transform:translateX(22px) scale(.985)}100%{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      <Card
        className="overflow-hidden p-4"
        onMouseEnter={() => setExpandedSlide(true)}
        onMouseLeave={() => setExpandedSlide(false)}
      >
        <div
          key={`${activeSlide.title}-${expandedSlide ? 'full' : 'compact'}`}
          className="will-change-transform"
          style={{ animation: 'leaderboard-slide-in 420ms cubic-bezier(.22,1,.36,1)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{activeSlide.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {loading ? 'Loading real users...' : expandedSlide ? 'Showing ranks 1 to 100' : 'Showing top 3'}
              </p>
            </div>

            {myRow ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenMyRow((current) => (current === activeSlide.title ? null : activeSlide.title))
                  }
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  {isMyRowOpen ? 'Hide your place' : `Your rank #${myRow.rank}`}
                </button>

                {isMyRowOpen ? (
                  <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-lg">
                    <p className="text-sm font-semibold text-slate-900">{myRow.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{myRow.place}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      Rank #{myRow.rank} with {myRow.trees} trees
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`mt-3 space-y-2 pr-1 ${expandedSlide ? 'max-h-[26rem] overflow-y-auto' : ''}`}>
            {visibleRows.map((row) => (
              <div
                key={`${activeSlide.title}-${row.rank}`}
                className={`flex items-center justify-between rounded-2xl px-3 py-2 transition-all duration-300 ${
                  row.isMe ? 'border border-emerald-200 bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {medalByRank[row.rank] ? `${medalByRank[row.rank]} ` : ''}
                    Rank {row.rank} - {row.name}
                  </p>
                  {row.isMe ? (
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-700">
                      Tap "Your rank" to view your place
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-emerald-700">{row.trees}</p>
              </div>
            ))}

            {!loading && visibleRows.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500">
                No real users ranked yet.
              </p>
            ) : null}

            {!expandedSlide ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500">
                Move cursor here to view full ranking up to 100
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-300'
            }`}
            aria-label={`Show ${slide.title}`}
          />
        ))}
      </div>
    </div>
  )
}
