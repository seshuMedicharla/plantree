import { memo, useEffect, useRef, useState } from 'react'
import { Bookmark, Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react'
import Pill from './Pill'

type ReelPlayerProps = {
  videoUrl: string
  caption: string
  user: string
  place: string
  trees: number
  zoneTag?: 'NEGATIVE' | 'NORMAL'
  videoRef: (element: HTMLVideoElement | null) => void
}

function ReelPlayer({
  videoUrl,
  caption,
  user,
  place,
  trees,
  zoneTag,
  videoRef,
}: ReelPlayerProps) {
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showBurst, setShowBurst] = useState(false)

  const tapRef = useRef(0)

  useEffect(() => {
    if (!showBurst) return
    const timer = window.setTimeout(() => setShowBurst(false), 650)
    return () => window.clearTimeout(timer)
  }, [showBurst])

  const onDoubleTapLike = () => {
    const now = Date.now()
    const isDoubleTap = now - tapRef.current < 280
    tapRef.current = now

    if (!isDoubleTap) return
    setLiked(true)
    setShowBurst(true)
  }

  const verified = zoneTag === 'NEGATIVE'

  return (
    <article data-reel-item className="relative h-full snap-start overflow-hidden rounded-3xl bg-black">
      <style>{`@keyframes reel-heart-burst{0%{transform:scale(.45);opacity:0}20%{transform:scale(1.08);opacity:1}100%{transform:scale(1.7);opacity:0}}`}</style>

      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onClick={onDoubleTapLike}
        onTouchEnd={onDoubleTapLike}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 1px 3px)',
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {showBurst ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Heart
            size={96}
            fill="currentColor"
            className="text-white/90"
            style={{ animation: 'reel-heart-burst 650ms ease-out forwards' }}
          />
        </div>
      ) : null}

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
          {user.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{user}</p>
          <p className="text-xs text-slate-300">{place}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMuted((prev) => !prev)}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/35 p-2 text-white"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <div className="absolute inset-y-0 right-3 flex flex-col items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => setLiked((prev) => !prev)}
          className={`rounded-full border border-white/20 bg-black/30 p-3 text-white transition-transform ${
            liked ? 'scale-110 text-rose-400' : 'hover:scale-105'
          }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="rounded-full border border-white/20 bg-black/30 p-3 text-white">
          <MessageCircle size={18} />
        </button>
        <button type="button" className="rounded-full border border-white/20 bg-black/30 p-3 text-white">
          <Send size={18} />
        </button>
        <button
          type="button"
          onClick={() => setSaved((prev) => !prev)}
          className={`rounded-full border border-white/20 bg-black/30 p-3 text-white ${saved ? 'text-emerald-300' : ''}`}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pr-16">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Pill text={`${trees} trees`} className="border-white/20 bg-white/10 text-white" />
          {zoneTag ? (
            <Pill
              text={zoneTag}
              className={
                zoneTag === 'NEGATIVE'
                  ? 'border-rose-300/40 bg-rose-500/20 text-rose-200'
                  : 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
              }
            />
          ) : null}
        </div>

        <p
          className="text-sm leading-5 text-white"
          style={
            expanded
              ? undefined
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
          }
        >
          {caption}
        </p>
        {caption.length > 64 ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1 text-xs font-semibold text-emerald-300"
          >
            {expanded ? 'less' : 'more'}
          </button>
        ) : null}

        {verified ? (
          <span className="mt-2 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200">
            Verified
          </span>
        ) : null}
      </div>
    </article>
  )
}

export default memo(ReelPlayer)
