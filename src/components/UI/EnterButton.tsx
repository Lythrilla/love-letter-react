import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { isMobile } from '../../utils'

export function EnterButton() {
  const phase = useAppStore((s) => s.phase)
  const photosLoaded = useAppStore((s) => s.photosLoaded)
  const setPhase = useAppStore((s) => s.setPhase)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (phase === 'ready' && photosLoaded) {
      const timer = setTimeout(() => setShow(true), 500)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [phase, photosLoaded])

  if (phase !== 'ready' || !photosLoaded) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: isMobile ? '12vh' : '15vh',
        left: '50%',
        transform: `translateX(-50%) scale(${show ? 1 : 0.9})`,
        zIndex: 50,
        transition: 'transform 1.5s ease-out',
        pointerEvents: show ? 'auto' : 'none'
      }}
    >
      <button
        onClick={() => setPhase('reading')}
        style={{
          position: 'relative',
          padding: isMobile ? '14px 36px' : '16px 48px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '12px',
          letterSpacing: '0.4em',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'all 0.4s ease',
          opacity: show ? 1 : 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* 扫描光效 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transform: show ? 'translateX(300%)' : 'translateX(-100%)',
            transition: 'transform 1.5s ease-out 0.3s',
            pointerEvents: 'none'
          }}
        />
        
        {/* 顶部线条 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }} />
        
        {/* 底部线条 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }} />

        <span style={{ position: 'relative', zIndex: 10 }}>
          OPEN THE LETTER
        </span>
      </button>
    </div>
  )
}
