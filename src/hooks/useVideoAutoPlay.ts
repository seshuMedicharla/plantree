import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

type UseVideoAutoPlayOptions = {
  containerRef: RefObject<HTMLElement | null>
  videosRef: RefObject<Array<HTMLVideoElement | null>>
  threshold?: number
  itemSelector?: string
}

export default function useVideoAutoPlay({
  containerRef,
  videosRef,
  threshold = 0.6,
  itemSelector = '[data-reel-item]',
}: UseVideoAutoPlayOptions): number {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const videos = videosRef.current
      .map((video, index) => ({ video, index }))
      .filter((item): item is { video: HTMLVideoElement; index: number } => Boolean(item.video))

    if (!container || videos.length === 0) return

    const targetMap = new Map<Element, { video: HTMLVideoElement; index: number }>()
    const ratioMap = new Map<number, number>()

    videos.forEach(({ video, index }) => {
      const target = video.closest(itemSelector) ?? video
      targetMap.set(target, { video, index })
      ratioMap.set(index, 0)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const mapped = targetMap.get(entry.target)
          if (!mapped) return

          const { video, index } = mapped
          const ratio = entry.isIntersecting ? entry.intersectionRatio : 0
          ratioMap.set(index, ratio)

          if (ratio >= threshold) {
            const playPromise = video.play()
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {})
            }
          } else {
            video.pause()
          }
        })

        let nextIndex = activeIndex
        let maxRatio = 0

        ratioMap.forEach((ratio, index) => {
          if (ratio > maxRatio) {
            maxRatio = ratio
            nextIndex = index
          }
        })

        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex)
        }
      },
      {
        root: container,
        threshold: [0, threshold, 0.8, 1],
      }
    )

    targetMap.forEach((_, target) => observer.observe(target))

    return () => {
      observer.disconnect()
      videos.forEach(({ video }) => video.pause())
    }
  }, [activeIndex, containerRef, itemSelector, threshold, videosRef])

  return activeIndex
}
