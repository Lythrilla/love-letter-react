import { useEffect, useRef } from 'react'

interface GestureOptions {
  onNext?: () => void
  onPrev?: () => void
  onEscape?: () => void
  enabled?: boolean
  threshold?: number
}

/**
 * 统一的手势控制 hook
 * 支持滚轮、键盘、触摸滑动
 */
export function useGesture({
  onNext,
  onPrev,
  onEscape,
  enabled = true,
  threshold = 40,
}: GestureOptions) {
  const isAnimating = useRef(false)
  const touchRef = useRef({ startY: 0, startX: 0, isSwiping: false })

  // 滚轮控制
  useEffect(() => {
    if (!enabled) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (isAnimating.current) return

      if (e.deltaY > 0) {
        onNext?.()
      } else {
        onPrev?.()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [enabled, onNext, onPrev])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating.current) return

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        onNext?.()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      } else if (e.key === 'Escape') {
        onEscape?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onNext, onPrev, onEscape])

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      touchRef.current.startY = e.touches[0].clientY
      touchRef.current.startX = e.touches[0].clientX
      touchRef.current.isSwiping = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating.current) return

      const deltaY = touchRef.current.startY - e.touches[0].clientY
      const deltaX = touchRef.current.startX - e.touches[0].clientX

      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        e.preventDefault()
        touchRef.current.isSwiping = true
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current || !touchRef.current.isSwiping) return

      const deltaY = touchRef.current.startY - e.changedTouches[0].clientY

      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onNext?.()
        } else {
          onPrev?.()
        }
      }

      touchRef.current.isSwiping = false
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, onNext, onPrev, threshold])
}
