import { useAppStore } from '../../store/useAppStore'
import { useState } from 'react'

export function MemoryButton() {
  const isMemoryMode = useAppStore((s) => s.isMemoryMode)
  const setMemoryMode = useAppStore((s) => s.setMemoryMode)
  const phase = useAppStore((s) => s.phase)
  const [hovered, setHovered] = useState(false)
  
  if (phase !== 'ready') return null
  
  return (
    <button
      onClick={() => setMemoryMode(!isMemoryMode)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isMemoryMode ? 'Return' : 'Timeline'}
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
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
        background: isMemoryMode || hovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isMemoryMode || hovered ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
        color: isMemoryMode || hovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.4s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isMemoryMode ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
    </button>
  )
}
