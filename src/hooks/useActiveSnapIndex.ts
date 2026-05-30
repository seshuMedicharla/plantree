import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

type UseActiveSnapIndexByRefs = {
  refs: Array<RefObject<HTMLElement | null>>
  containerRef?: RefObject<HTMLElement | null>
  threshold?: number
}

type UseActiveSnapIndexBySelector = {
  containerRef: RefObject<HTMLElement | null>
  itemSelector: string
  threshold?: number
}

type UseActiveSnapIndexOptions =
  | UseActiveSnapIndexByRefs
  | UseActiveSnapIndexBySelector

export default function useActiveSnapIndex(
  options: UseActiveSnapIndexOptions
): number {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const threshold = options.threshold ?? 0.6
    const container = options.containerRef?.current ?? null

    let elements: HTMLElement[] = []
    if ('refs' in options) {
      elements = options.refs
        .map((ref) => ref.current)
        .filter((el): el is HTMLElement => Boolean(el))
    } else if (container) {
      elements = Array.from(
        container.querySelectorAll<HTMLElement>(options.itemSelector)
      )
    }

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let nextIndex = activeIndex
        let maxRatio = 0

        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.intersectionRatio < threshold) continue

          const index = elements.findIndex((item) => item === entry.target)
          if (index === -1) continue

          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            nextIndex = index
          }
        }

        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex)
        }
      },
      {
        root: container ?? null,
        threshold: [threshold, 0.75, 0.9],
      }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [activeIndex, options])

  return activeIndex
}
