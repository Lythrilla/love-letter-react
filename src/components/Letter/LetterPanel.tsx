import { useEffect, useRef, useState, memo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { LetterContent } from './LetterContent'

export const LetterPanel = memo(function LetterPanel() {
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<number>(0)
  const [autoScroll, setAutoScroll] = useState(true)

  const handleClose = () => {
    setPhase('ready')
    clearInterval(autoScrollRef.current)
  }

  // 自动滚动逻辑 - 使用 requestAnimationFrame + 累积器实现平滑慢速滚动
  useEffect(() => {
    const el = scrollRef.current
    if (phase !== 'reading' || !el || !autoScroll) {
      return
    }

    const delay = el.scrollTop === 0 ? 1500 : 0
    const pixelsPerSecond = 25 // 每秒滚动像素数（调这个控制速度）
    let lastTime = 0
    let accumulator = 0
    
    const startTimeout = setTimeout(() => {
      const scroll = (currentTime: number) => {
        if (!scrollRef.current) return
        
        if (lastTime === 0) lastTime = currentTime
        const delta = (currentTime - lastTime) / 1000 // 转为秒
        lastTime = currentTime
        
        accumulator += delta * pixelsPerSecond
        
        if (accumulator >= 1) {
          const pixels = Math.floor(accumulator)
          accumulator -= pixels
          
          const { scrollTop, clientHeight, scrollHeight } = scrollRef.current
          const atBottom = scrollTop + clientHeight >= scrollHeight - 2
          
          if (!atBottom) {
            scrollRef.current.scrollTop = scrollTop + pixels
          } else {
            return // 到底了，停止
          }
        }
        
        autoScrollRef.current = requestAnimationFrame(scroll)
      }
      
      autoScrollRef.current = requestAnimationFrame(scroll)
    }, delay)

    return () => {
      clearTimeout(startTimeout)
      cancelAnimationFrame(autoScrollRef.current)
    }
  }, [phase, autoScroll])

  return (
    <div className={`letter-container ${phase === 'reading' ? 'open' : ''}`}>
      {/* 模糊背景层 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(25px) saturate(180%)',
          WebkitBackdropFilter: 'blur(25px) saturate(180%)',
          zIndex: -1,
        }}
      />
      
      {/* 关闭按钮 */}
      <button className="close-btn" onClick={handleClose} aria-label="关闭">
        ×
      </button>

      {/* 自动滚动开关 */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          right: '30px',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: autoScroll ? 'rgba(255,107,157,0.2)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${autoScroll ? 'rgba(255,107,157,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '50%',
            color: autoScroll ? 'rgba(255,107,157,1)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="自动滚动"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>

      <div className="scroll-area" ref={scrollRef}>
        <LetterContent />
      </div>
    </div>
  )
})
