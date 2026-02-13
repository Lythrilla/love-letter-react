export const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

export { useGesture } from './useGesture'

export function throttle<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function formatTime(t: number): string {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function binarySearch<T>(arr: T[], predicate: (item: T) => boolean): number {
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (predicate(arr[mid])) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return hi
}
