import { useAppStore } from '../../store/useAppStore'
import { useState, useEffect, useRef } from 'react'

export function KeyHint() {
  const phase = useAppStore((s) => s.phase)
  const [showHint, setShowHint] = useState(false)
  const [manualShow, setManualShow] = useState(false)
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hasShownHint] = useState(() => {
    return localStorage.getItem('keyHintShown') === 'true'
  })
  
  // 首次进入 ready 阶段时显示提示
  useEffect(() => {
    if (phase === 'ready' && !hasShownHint) {
      const showTimer = setTimeout(() => {
        setShowHint(true)
        localStorage.setItem('keyHintShown', 'true')
        
        // 8秒后自动隐藏
        autoHideTimer.current = setTimeout(() => setShowHint(false), 8000)
      }, 1500)
      
      return () => {
        clearTimeout(showTimer)
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current)
      }
    }
  }, [phase, hasShownHint])
  
  // K 键切换显示
  useEffect(() => {
    if (phase !== 'ready') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k') {
        setManualShow(prev => !prev)
        setShowHint(prev => !prev)
        // 清除自动隐藏计时器
        if (autoHideTimer.current) {
          clearTimeout(autoHideTimer.current)
          autoHideTimer.current = null
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase])
  
  // 手动调出时，点击或滚轮隐藏
  useEffect(() => {
    if (showHint && manualShow) {
      const handleInteraction = () => {
        setShowHint(false)
        setManualShow(false)
      }
      window.addEventListener('click', handleInteraction)
      window.addEventListener('wheel', handleInteraction)
      return () => {
        window.removeEventListener('click', handleInteraction)
        window.removeEventListener('wheel', handleInteraction)
      }
    }
  }, [showHint, manualShow])
  
  if (!showHint || phase !== 'ready') return null
  
  return (
    <div
      className={manualShow ? 'key-hint-manual' : 'key-hint-auto'}
      style={{
        position: 'fixed',
        top: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.35)',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span>WASD 移动</span>
        <span>·</span>
        <span>Space/Shift 升降</span>
        <span>·</span>
        <span>滚轮 缩放</span>
        <span>·</span>
        <span>拖拽 视角</span>
        <span>·</span>
        <span>K 帮助</span>
      </div>
      
      <style>{`
        .key-hint-auto {
          animation: keyHintFade 8s ease forwards;
        }
        .key-hint-manual {
          animation: keyHintIn 0.3s ease forwards;
        }
        @keyframes keyHintFade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes keyHintIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
