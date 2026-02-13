import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useEasterEggStore } from '../../store/useEasterEggStore'
import { isMobile } from '../../utils'
import gsap from 'gsap'
import { EasterEgg3DBackground } from './EasterEgg3DBackground'

function TypewriterText({
  text,
  delay = 0,
  cursorColor = 'rgba(255,255,255,0.15)',
}: {
  text: string
  delay?: number
  cursorColor?: string
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    setDisplayedText('')
    setShowCursor(true)
    
    const chars = text.split('')
    let currentIndex = 0
    let intervalId: ReturnType<typeof setInterval> | null = null
    
    const startTyping = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex < chars.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          if (intervalId) clearInterval(intervalId)
          setTimeout(() => setShowCursor(false), 2000)
        }
      }, 70)
    }, delay)
    
    return () => {
      clearTimeout(startTyping)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, delay])

  return (
    <div>
      {displayedText.split('\n').map((line, idx) => (
        <p key={idx} style={{ margin: '0.6rem 0', lineHeight: 2.4 }}>{line}</p>
      ))}
      <span style={{ 
        opacity: showCursor ? 1 : 0,
        transition: 'opacity 0.5s',
        color: cursorColor,
      }}>|</span>
    </div>
  )
}

export function EasterEggModal() {
  const { currentEgg, dismissEgg, init, visitCount } = useEasterEggStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const isMect = currentEgg?.id === 'mect'

  useEffect(() => {
    init()
  }, [init])

  const runAnimation = useCallback(() => {
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current)
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      )
    }

    if (contentRef.current) {
      const elements = contentRef.current.querySelectorAll('.fade-item')
      gsap.set(elements, { opacity: 0, y: 40 })
      gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.08,
        delay: 0.3,
        ease: 'power3.out',
      })
    }
  }, [])

  useEffect(() => {
    if (!currentEgg) return
    runAnimation()
  }, [currentEgg, runAnimation])

  const handleDismiss = () => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          if (containerRef.current) {
            gsap.killTweensOf(containerRef.current)
            gsap.to(containerRef.current, {
              opacity: 0,
              duration: 0.35,
              ease: 'power2.in',
              onComplete: () => {
                dismissEgg()
              },
            })
          } else {
            dismissEgg()
          }
        },
      })
    } else {
      dismissEgg()
    }
  }

  // 提取颜色用于 3D 粒子
  const colorScheme = useMemo(() => {
    if (!currentEgg) return ['#ff3cac', '#784ba0', '#2b86c5', '#ffd166']
    const bg = currentEgg.background || ''
    const hexMatches = bg.match(/#[0-9A-Fa-f]{6}/g)
    return hexMatches?.slice(0, 5) || ['#ff3cac', '#784ba0', '#2b86c5', '#ffd166']
  }, [currentEgg])

  if (!currentEgg) return null

  const getTypeLabel = () => {
    switch (currentEgg.type) {
      case 'visit_count': return `NO. ${visitCount}`
      case 'date_range': return currentEgg.startDate?.replace(/-/g, '.')
      case 'anniversary': return '纪念日'
      case 'time_range': return '此刻'
      case 'long_absence': return '久别重逢'
      default: return '✦'
    }
  }

  return (
    <div
      ref={containerRef}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: currentEgg.background || 'linear-gradient(135deg, #06060a 0%, #0a0a10 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '22px' : '48px',
        fontFamily: '"Noto Serif SC", serif',
        opacity: 1,
      }}
    >
      {/* 3D 背景 */}
      <EasterEgg3DBackground colorScheme={colorScheme} />

      {/* 背景遮罩 */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(0,0,0,0.3) 100%)',
        pointerEvents: 'none',
      }} />

      {/* 毛玻璃卡片 */}
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '90%' : '800px',
          maxWidth: '95%',
          maxHeight: isMobile ? '85vh' : '500px',
          background: 'rgba(20, 20, 30, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        {/* 左侧 - Emoji 展示区 */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '30px 20px' : '40px 30px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
          borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}>
          {currentEgg.emoji && (
            <div className="fade-item" style={{
              fontSize: isMobile ? '60px' : '80px',
              lineHeight: 1,
              marginBottom: '16px',
              filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.2))',
              animation: 'float 4s ease-in-out infinite',
            }}>
              {currentEgg.emoji}
            </div>
          )}
          <span className="fade-item" style={{
            fontSize: '9px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}>
            {getTypeLabel()}
          </span>
        </div>

        {/* 右侧 - 内容区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '24px 20px' : '36px 40px',
          overflow: 'hidden',
        }}>
          {/* 标题 */}
          {currentEgg.title && (
            <h1 className="fade-item" style={{
              fontSize: isMobile ? '20px' : '26px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '0.03em',
              margin: '0 0 16px 0',
              lineHeight: 1.3,
            }}>
              {currentEgg.title}
            </h1>
          )}

          {/* 分割线 */}
          <div className="fade-item" style={{
            width: '30px',
            height: '2px',
            background: 'rgba(255,255,255,0.3)',
            marginBottom: '16px',
          }} />

          {/* 正文 */}
          <div className="fade-item" style={{
            flex: 1,
            fontSize: isMobile ? '13px' : '14px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.9,
            whiteSpace: 'pre-line',
            overflowY: 'auto',
            paddingRight: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}>
            {isMect ? (
              <TypewriterText text={currentEgg.message} delay={400} cursorColor="rgba(255,255,255,0.3)" />
            ) : (
              currentEgg.message
            )}
          </div>

          {/* 按钮 */}
          <button
            className="fade-item"
            onClick={handleDismiss}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              fontSize: '11px',
              letterSpacing: '0.1em',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          >
            继续 →
          </button>
        </div>
      </div>

      {/* CSS 动画 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

    </div>
  )
}
