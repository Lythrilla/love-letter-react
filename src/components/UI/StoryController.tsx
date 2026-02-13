import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { PHOTO_STORIES } from '../../config/photoStories'

const storyCount = Object.keys(PHOTO_STORIES).length

export function StoryController() {
  const phase = useAppStore((s) => s.phase)
  const currentStoryIndex = useAppStore((s) => s.currentStoryIndex)
  const setCurrentStoryIndex = useAppStore((s) => s.setCurrentStoryIndex)
  const setPhase = useAppStore((s) => s.setPhase)
  
  const lastWheelTime = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'stories') return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const now = Date.now()
      if (now - lastWheelTime.current < 800) return
      lastWheelTime.current = now

      if (e.deltaY > 0) {
        if (currentStoryIndex < storyCount - 1) {
          setCurrentStoryIndex(currentStoryIndex + 1)
        } else {
          setPhase('ready')
          setCurrentStoryIndex(0)
        }
      } else {
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(currentStoryIndex - 1)
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [phase, currentStoryIndex, setCurrentStoryIndex, setPhase])

  useEffect(() => {
    if (phase !== 'stories') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (currentStoryIndex < storyCount - 1) {
          setCurrentStoryIndex(currentStoryIndex + 1)
        } else {
          setPhase('ready')
          setCurrentStoryIndex(0)
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(currentStoryIndex - 1)
        }
      } else if (e.key === 'Escape') {
        setPhase('ready')
        setCurrentStoryIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentStoryIndex, setCurrentStoryIndex, setPhase])

  if (phase !== 'stories' || storyCount === 0) return null

  return (
    <div ref={containerRef} className="fixed inset-0 z-40 pointer-events-none select-none">
      <div
        style={{
          position: 'absolute',
          right: '40px',
          bottom: '45px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {Array.from({ length: storyCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStoryIndex ? '24px' : '12px',
                height: '2px',
                borderRadius: '1px',
                background: i <= currentStoryIndex 
                  ? 'rgba(255, 255, 255, 0.7)' 
                  : 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
        
        <span style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
          minWidth: '28px',
        }}>
          {currentStoryIndex + 1}/{storyCount}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '45px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'system-ui, sans-serif',
        }}>
          滚轮切换
        </span>

        <button
          onClick={() => {
            setPhase('ready')
            setCurrentStoryIndex(0)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 0',
            pointerEvents: 'auto',
            fontFamily: 'system-ui, sans-serif',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          跳过 →
        </button>
      </div>
    </div>
  )
}
