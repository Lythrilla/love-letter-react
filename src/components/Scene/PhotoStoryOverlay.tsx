import { Html } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { PhotoStory } from '../../config/photoStories'

interface Props {
  story: PhotoStory
  onClose: () => void
}

export function PhotoStoryOverlay({ story, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    // 简化动画，移除 blur 滤镜
    gsap.fromTo(containerRef.current, 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, [])

  const handleClose = () => {
    if (!containerRef.current) {
      onClose()
      return
    }
    
    gsap.to(containerRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: onClose
    })
  }

  return (
    <Html center position={[0, -25, 0]} style={{ pointerEvents: 'auto' }}>
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97), rgba(25, 20, 40, 0.95))',
          borderRadius: '16px',
          padding: '24px 32px',
          minWidth: '280px',
          maxWidth: '400px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)',
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
        >
          ×
        </button>

        {/* 日期 */}
        {story.date && (
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 107, 157, 0.9)',
            letterSpacing: '0.15em',
            marginBottom: '8px',
            fontFamily: 'system-ui, sans-serif',
          }}>
            {story.date}
          </div>
        )}

        {/* 标题 */}
        {story.title && (
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #fff, #ffd0e0)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontFamily: '"Noto Serif SC", serif',
          }}>
            {story.title}
          </h3>
        )}

        {/* 内容 */}
        <p style={{
          fontSize: '14px',
          lineHeight: 1.8,
          color: 'rgba(255, 255, 255, 0.85)',
          fontFamily: '"Noto Serif SC", serif',
          whiteSpace: 'pre-wrap',
        }}>
          {story.content}
        </p>

        {/* 装饰线 */}
        <div style={{
          marginTop: '20px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,107,157,0.4), transparent)',
        }} />
      </div>
    </Html>
  )
}
