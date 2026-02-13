import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import gsap from 'gsap'

const INTRO_TEXTS = [
  '有些人的出现',
  '是为了告诉你',
  '什么是遗憾',
  '双人成行里有一句话',
  '我一生最棒的事情就是寻到了你',
  '这是我们的故事',
]

export function IntroSequence() {
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const setShowPhotos = useAppStore((s) => s.setShowPhotos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const textRef = useRef<HTMLHeadingElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 重置 currentIndex 当重新进入 intro 阶段
  useEffect(() => {
    if (phase === 'intro') {
      setCurrentIndex(0)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'intro' || !textRef.current) return

    const el = textRef.current
    
    // 初始状态 - 极简
    gsap.set(el, { opacity: 0 })

    // 进入：纯淡入
    const tl = gsap.timeline()
    tl.to(el, {
      opacity: 1,
      duration: 0.62,
      ease: 'power1.out'
    })
    
    // 停留
    const waitTime = currentIndex === INTRO_TEXTS.length - 1 ? 1200 : 1200
    tl.to({}, { duration: waitTime / 1000 })
    
    // 离开：纯淡出
    tl.to(el, {
      opacity: 0,
      duration: 0.3,
      ease: 'power1.in',
      onComplete: () => {
        if (currentIndex < INTRO_TEXTS.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setShowPhotos(true)
          setTimeout(() => setPhase('stories'), 600)
        }
      }
    })

    return () => { tl.kill() }
  }, [currentIndex, phase, setPhase, setShowPhotos])

  const handleSkip = () => {
    setShowPhotos(true)
    setPhase('stories')
  }

  if (phase !== 'intro') return null

  return (
    <div ref={containerRef} className="fixed inset-0 z-20 flex items-center justify-center select-none">
      {/* 极简文字 */}
      <h2
        ref={textRef}
        key={currentIndex}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
          fontWeight: 200,
          color: 'rgba(255, 255, 255, 0.9)',
          letterSpacing: '0.3em',
          lineHeight: 2,
          padding: '0 3rem',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {INTRO_TEXTS[currentIndex]}
      </h2>
      
      {/* 跳过按钮 */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          right: '2.5rem',
          padding: '0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.15em',
          transition: 'color 0.3s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
      >
        跳过 →
      </button>
    </div>
  )
}
