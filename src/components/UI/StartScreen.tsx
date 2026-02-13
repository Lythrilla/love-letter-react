import { useAppStore } from '../../store/useAppStore'
import { useState, useEffect } from 'react'
import { startTexturePreload } from '../Scene/FloatingPhotos'

export function StartScreen() {
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const setMusicStarted = useAppStore((s) => s.setMusicStarted)
  const [isExiting, setIsExiting] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (phase === 'start') {
      setIsExiting(false)
      setStep(0)
      const timers = [
        setTimeout(() => setStep(1), 300),
        setTimeout(() => setStep(2), 800),
        setTimeout(() => setStep(3), 1300),
        setTimeout(() => setStep(4), 1800),
      ]
      return () => timers.forEach(clearTimeout)
    }
  }, [phase])

  if (phase !== 'start') return null

  const handleStart = () => {
    setIsExiting(true)
    setMusicStarted(true)
    startTexturePreload()
    setTimeout(() => setPhase('intro'), 1200)
  }

  return (
    <div 
      onClick={handleStart}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: isExiting ? 'none' : 'auto',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div className="start-line line-top" style={{ opacity: step >= 1 ? 1 : 0 }} />
      <div className="start-line line-bottom" style={{ opacity: step >= 1 ? 1 : 0 }} />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{
          opacity: step >= 1 ? 0.6 : 0,
          transform: step >= 1 ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.8)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: '2.5rem',
          color: 'rgba(255,255,255,0.8)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 200,
          color: 'white',
          letterSpacing: '0.4em',
          marginBottom: '1rem',
          fontFamily: '"Noto Serif SC", serif',
          position: 'relative',
        }}>
          {'写给X的信'.split('').map((char, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: step >= 2 ? 1 : 0,
                transform: step >= 2 ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`,
              }}
            >
              {char}
            </span>
          ))}
        </h1>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '4rem',
          opacity: step >= 3 ? 1 : 0,
          transform: step >= 3 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5))' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}>
            A Letter to X
          </span>
          <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.5), transparent)' }} />
        </div>
        
        <div
          className="start-hint"
          style={{
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span className="hint-dot" />
          <span style={{
            fontSize: '10px',
            fontWeight: 300,
            letterSpacing: '0.3em',
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            点击任意位置开始
          </span>
          <span className="hint-dot" />
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: step >= 4 ? 0.4 : 0,
        transition: 'opacity 1s ease-out',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
        <span style={{
          fontSize: '9px',
          fontWeight: 300,
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.6)',
        }}>
          建议佩戴耳机
        </span>
      </div>

      <style>{`
        .start-line {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 60px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: opacity 1s ease;
        }
        .line-top { top: 60px; }
        .line-bottom { bottom: 100px; }
        
        .start-hint {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .hint-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
