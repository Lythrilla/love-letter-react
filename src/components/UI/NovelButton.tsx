import { useAppStore } from '../../store/useAppStore'
import { useState } from 'react'

export function NovelButton() {
  const setShowNovel = useAppStore((s) => s.setShowNovel)
  const phase = useAppStore((s) => s.phase)
  const [hovered, setHovered] = useState(false)
  
  if (phase !== 'ready') return null
  
  return (
    <button
      onClick={() => setShowNovel(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="小说"
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '100px',
        zIndex: 40,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: hovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: hovered ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
        color: hovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.4s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}>
        {/* 书本图标 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
    </button>
  )
}
