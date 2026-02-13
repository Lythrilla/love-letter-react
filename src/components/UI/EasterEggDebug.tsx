import { useState, useEffect, useMemo } from 'react'
import { useEasterEggStore } from '../../store/useEasterEggStore'
import { easterEggs } from '../../config/easterEggs'
import type { EasterEgg } from '../../config/easterEggs'
import { isMobile } from '../../utils'

const typeLabels: Record<string, string> = {
  visit_count: '访问次数',
  date_range: '节日',
  anniversary: '纪念日',
  time_range: '时间段',
  long_absence: '久别重逢',
}

const typeIcons: Record<string, string> = {
  visit_count: '🔢',
  date_range: '📅',
  anniversary: '💝',
  time_range: '⏰',
  long_absence: '🌙',
}

function EggCard({ egg, shown, onTrigger }: { egg: EasterEgg; shown: boolean; onTrigger: () => void }) {
  const [hover, setHover] = useState(false)
  
  const getSubtitle = () => {
    switch (egg.type) {
      case 'visit_count': return `第 ${egg.triggerCount} 次`
      case 'date_range': return egg.startDate?.replace(/-/g, '.')
      case 'anniversary': return `每年 ${egg.anniversaryDate?.replace('-', '.')}`
      case 'time_range': return `${egg.startHour}:00 - ${egg.endHour}:00`
      case 'long_absence': return `${egg.absenceDays} 天未访问`
      default: return ''
    }
  }

  return (
    <button
      onClick={onTrigger}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: '1px solid',
        borderColor: shown ? 'rgba(255,255,255,0.05)' : hover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: isMobile ? '14px 16px' : '16px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.25s ease',
        opacity: shown ? 0.4 : 1,
        transform: hover && !shown ? 'translateY(-2px)' : 'none',
        boxShadow: hover && !shown ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: isMobile ? 20 : 24 }}>{egg.emoji || '✨'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 400,
            color: shown ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {egg.title || egg.id}
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.05em',
          }}>
            {getSubtitle()}
          </div>
        </div>
        {shown && (
          <div style={{
            fontSize: 9,
            color: 'rgba(100,255,150,0.5)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            已触发
          </div>
        )}
      </div>
    </button>
  )
}

export function EasterEggDebug() {
  const { visitCount, shownEggs, resetShownEggs, triggerEggById, init, missedEggs } = useEasterEggStore()
  
  const testMissedPrompt = () => {
    // 如果没有真正错过的彩蛋，用第一个彩蛋模拟
    const testEggs = missedEggs.length > 0 ? missedEggs : [easterEggs[0]]
    useEasterEggStore.setState({ 
      showMissedPrompt: true,
      missedEggs: testEggs,
    })
    setIsOpen(false)
  }
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    init()
    const timer = setTimeout(() => setMounted(true), 500)
    return () => clearTimeout(timer)
  }, [init])

  const groupedEggs = useMemo(() => {
    const groups: Record<string, EasterEgg[]> = {}
    easterEggs.forEach(egg => {
      if (!groups[egg.type]) groups[egg.type] = []
      groups[egg.type].push(egg)
    })
    return groups
  }, [])

  const filteredEggs = useMemo(() => {
    if (activeTab === 'all') return easterEggs
    return groupedEggs[activeTab] || []
  }, [activeTab, groupedEggs])

  const triggerEgg = (eggId: string) => {
    triggerEggById(eggId)
    setIsOpen(false)
  }

  const resetAll = () => {
    localStorage.removeItem('love-letter-easter-eggs')
    window.location.reload()
  }

  if (!mounted) return null

  // 生产环境隐藏debug面板
  if (import.meta.env.PROD) return null

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 999999,
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          padding: '8px',
          fontSize: 10,
          letterSpacing: '0.15em',
          cursor: 'pointer',
          fontFamily: '"Noto Serif SC", serif',
          transition: 'all 0.3s',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
          e.currentTarget.style.letterSpacing = '0.25em'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.15)'
          e.currentTarget.style.letterSpacing = '0.15em'
        }}
      >
        Debug
      </button>
    )
  }

  const tabs = ['all', ...Object.keys(groupedEggs)]

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'linear-gradient(180deg, #0a0a14 0%, #050508 100%)',
        color: '#fff',
        fontFamily: '"Noto Serif SC", serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 装饰光晕 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(100, 80, 160, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* 头部 */}
      <div style={{
        padding: isMobile ? '24px 20px 16px' : '32px 40px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{
              fontSize: 9,
              color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Easter Eggs
            </p>
            <h1 style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.1em',
              margin: 0,
            }}>
              彩蛋调试
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 4,
            }}>
              访问次数
            </p>
            <p style={{
              fontSize: 24,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Georgia, serif',
            }}>
              {visitCount}
            </p>
          </div>
        </div>

        {/* 标签页 */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 12,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 11,
                color: activeTab === tab ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab === 'all' ? '✨' : typeIcons[tab]}
              <span>{tab === 'all' ? '全部' : typeLabels[tab]}</span>
              <span style={{
                fontSize: 9,
                opacity: 0.5,
                marginLeft: 2,
              }}>
                {tab === 'all' ? easterEggs.length : groupedEggs[tab]?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 彩蛋列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: isMobile ? '16px 20px' : '24px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? 10 : 14,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {filteredEggs.map(egg => (
            <EggCard
              key={egg.id}
              egg={egg}
              shown={shownEggs.includes(egg.id)}
              onTrigger={() => triggerEgg(egg.id)}
            />
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div style={{
        padding: isMobile ? '16px 20px' : '20px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile ? 16 : 32,
        flexShrink: 0,
        background: 'rgba(5,5,8,0.8)',
        backdropFilter: 'blur(10px)',
      }}>
        <button
          onClick={resetShownEggs}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: '10px 20px',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          重置已触发
        </button>
        <button
          onClick={testMissedPrompt}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,180,100,0.2)',
            borderRadius: 8,
            color: 'rgba(255, 180, 100, 0.6)',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: '10px 20px',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,180,100,0.5)'
            e.currentTarget.style.color = 'rgba(255,180,100,0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,180,100,0.2)'
            e.currentTarget.style.color = 'rgba(255,180,100,0.6)'
          }}
        >
          测试错过
        </button>
        <button
          onClick={resetAll}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 100, 100, 0.2)',
            borderRadius: 8,
            color: 'rgba(255, 100, 100, 0.6)',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: '10px 20px',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'
            e.currentTarget.style.color = 'rgba(255,100,100,0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,100,100,0.2)'
            e.currentTarget.style.color = 'rgba(255,100,100,0.6)'
          }}
        >
          完全重置
        </button>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: '10px 24px',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
          }}
        >
          关闭 →
        </button>
      </div>
    </div>
  )
}
