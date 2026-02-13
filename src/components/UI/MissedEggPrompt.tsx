import { memo, useEffect, useRef, useState } from 'react'
import { useEasterEggStore } from '../../store/useEasterEggStore'
import gsap from 'gsap'

export const MissedEggPrompt = memo(function MissedEggPrompt() {
  const showMissedPrompt = useEasterEggStore((s) => s.showMissedPrompt)
  const missedEggs = useEasterEggStore((s) => s.missedEggs)
  const viewMissedEgg = useEasterEggStore((s) => s.viewMissedEgg)
  const ignoreMissedEgg = useEasterEggStore((s) => s.ignoreMissedEgg)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // 当 missedEggs 变化时触发入场动画
  useEffect(() => {
    if (showMissedPrompt && missedEggs.length > 0 && cardRef.current) {
      // 入场动画
      gsap.fromTo(cardRef.current,
        { opacity: 0, x: 100, rotate: 8 },
        { opacity: 1, x: 0, rotate: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
      )
      // 内容元素依次入场
      if (contentRef.current) {
        const items = contentRef.current.querySelectorAll('.anim-item')
        gsap.fromTo(items,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, delay: 0.8, ease: 'power2.out' }
        )
      }
    }
  }, [showMissedPrompt, missedEggs.length])

  if (!showMissedPrompt || missedEggs.length === 0) return null

  const firstMissed = missedEggs[0]

  const handleView = () => {
    gsap.to(cardRef.current, {
      opacity: 0, scale: 0.95, y: -20, duration: 0.4, ease: 'power2.in',
      onComplete: () => viewMissedEgg(firstMissed)
    })
  }

  const handleIgnore = () => {
    gsap.to(cardRef.current, {
      opacity: 0, x: 100, rotate: 5, duration: 0.5, ease: 'power2.in',
      onComplete: () => ignoreMissedEgg(firstMissed.id)
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9998,
        fontFamily: '"Noto Serif SC", serif',
        width: 280,
      }}
    >
      {/* 背景光晕 */}
      <div style={{
        position: 'absolute',
        inset: -20,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
        filter: 'blur(20px)',
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
      }} />

      {/* 主卡片 */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, rgba(25, 25, 40, 0.92) 0%, rgba(15, 15, 25, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `
            0 25px 50px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 1px 0 rgba(255,255,255,0.1) inset
          `,
          overflow: 'hidden',
        }}
      >
        {/* 顶部装饰条 */}
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }} />

        {/* 内容区 */}
        <div style={{ padding: '20px 22px 18px' }}>
          {/* 标签行 */}
          <div className="anim-item" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
            }}>
              你错过了一封信
            </span>
            {missedEggs.length > 1 && (
              <span style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.1em',
              }}>
                +{missedEggs.length - 1}
              </span>
            )}
          </div>

          {/* 主内容 */}
          <div className="anim-item" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}>
            <div style={{
              fontSize: 38,
              lineHeight: 1,
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.15))',
              animation: 'gentleFloat 5s ease-in-out infinite',
            }}>
              {firstMissed.emoji || '💌'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 16,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.92)',
                marginBottom: 6,
                lineHeight: 1.3,
              }}>
                {firstMissed.title || '特别的话'}
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.5,
              }}>
                点击查看这段想对你说的话
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="anim-item" style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            marginBottom: 16,
          }} />

          {/* 按钮组 */}
          <div className="anim-item" style={{
            display: 'flex',
            gap: 10,
          }}>
            <button
              onClick={handleView}
              style={{
                flex: 1,
                padding: '11px 20px',
                fontSize: 12,
                letterSpacing: '0.1em',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.9)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              打开看看 →
            </button>
            <button
              onClick={handleIgnore}
              style={{
                padding: '11px 16px',
                fontSize: 12,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
              }}
            >
              下次
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-2deg); }
          75% { transform: translateY(2px) rotate(2deg); }
        }
      `}</style>
    </div>
  )
})
