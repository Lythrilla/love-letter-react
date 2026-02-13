import { useState, useRef, useEffect, useCallback } from 'react'
import { NOVELS, type Novel } from '../../config/novels'
import gsap from 'gsap'
import { isMobile } from '../../utils'

interface NovelReaderProps {
  visible: boolean
  onClose: () => void
}

export function NovelReader({ visible, onClose }: NovelReaderProps) {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [showChapterList, setShowChapterList] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible && containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    }
    if (!visible) {
      setSelectedNovel(null)
      setCurrentChapter(0)
      setShowChapterList(false)
      setShowUI(true)
    }
  }, [visible])

  useEffect(() => {
    if (scrollRef.current) {
      gsap.to(scrollRef.current, { scrollTop: 0, duration: 0.4, ease: 'power2.out' })
    }
  }, [currentChapter])

  // 自动隐藏 UI
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowUI(true)
    if (selectedNovel && !showChapterList) {
      hideTimer.current = setTimeout(() => setShowUI(false), 3000)
    }
  }, [selectedNovel, showChapterList])

  useEffect(() => {
    if (selectedNovel && !showChapterList) resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [selectedNovel, showChapterList, resetHideTimer])

  const handleClose = useCallback(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, { opacity: 0, duration: 0.4, onComplete: onClose })
    } else onClose()
  }, [onClose])

  const handleBack = useCallback(() => {
    if (showChapterList) setShowChapterList(false)
    else if (selectedNovel) { setSelectedNovel(null); setCurrentChapter(0) }
    else handleClose()
  }, [selectedNovel, showChapterList, handleClose])

  const toggleUI = () => {
    if (selectedNovel && !showChapterList) {
      setShowUI(v => !v)
      if (!showUI) resetHideTimer()
    }
  }

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack()
      if (selectedNovel && !showChapterList) {
        if (e.key === 'ArrowLeft' && currentChapter > 0) { setCurrentChapter(c => c - 1); resetHideTimer() }
        if (e.key === 'ArrowRight' && currentChapter < selectedNovel.chapters.length - 1) { setCurrentChapter(c => c + 1); resetHideTimer() }
        if (e.key === ' ') { e.preventDefault(); toggleUI() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, handleBack, selectedNovel, currentChapter, showChapterList, showUI])

  if (!visible) return null
  const chapter = selectedNovel?.chapters[currentChapter]
  const progress = selectedNovel ? ((currentChapter + 1) / selectedNovel.chapters.length) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      style={{ background: '#0a0a0c', opacity: 0 }}
      onMouseMove={selectedNovel ? resetHideTimer : undefined}
    >
      {/* 星空背景 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        background: 'radial-gradient(ellipse at 20% 30%, rgba(88,86,214,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255,107,107,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(78,205,196,0.08) 0%, transparent 70%)',
      }} />
      
      {/* 微光粒子效果 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.2), transparent)`,
        backgroundSize: '200px 200px',
      }} />

      {!selectedNovel ? (
        /* ===== 书架 - 极简卡片式 ===== */
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
              zIndex: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >×</button>

          {/* 书架内容 */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? '60px 24px' : '80px 40px',
            overflowY: 'auto',
          }}>
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h1 style={{
                fontSize: isMobile ? 32 : 42,
                fontWeight: 200,
                color: 'rgba(255,255,255,0.9)',
                fontFamily: '"Noto Serif SC", serif',
                letterSpacing: '0.15em',
                marginBottom: 12,
              }}>书 架</h1>
              <div style={{
                width: 60, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                margin: '0 auto',
              }} />
            </div>

            {/* 书籍网格 */}
            {NOVELS.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, letterSpacing: '0.1em' }}>暂无故事</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 24,
                width: '100%',
                maxWidth: 800,
              }}>
                {NOVELS.map((novel, idx) => (
                  <button
                    key={novel.id}
                    onClick={() => setSelectedNovel(novel)}
                    style={{
                      position: 'relative',
                      padding: '32px 28px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* 序号装饰 */}
                    <span style={{
                      position: 'absolute', top: 16, right: 20,
                      fontSize: 48, fontWeight: 100,
                      color: 'rgba(255,255,255,0.04)',
                      fontFamily: 'Georgia, serif',
                    }}>{String(idx + 1).padStart(2, '0')}</span>
                    
                    {/* 内容 */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h3 style={{
                        fontSize: 18, fontWeight: 400,
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: 8,
                        fontFamily: '"Noto Serif SC", serif',
                      }}>{novel.title}</h3>
                      {novel.author && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                          {novel.author}
                        </p>
                      )}
                      {novel.description && (
                        <p style={{
                          fontSize: 13, color: 'rgba(255,255,255,0.4)',
                          lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>{novel.description}</p>
                      )}
                      <div style={{
                        marginTop: 16, paddingTop: 16,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', gap: 16,
                      }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                          {novel.chapters.length} 章节
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== 阅读视图 - 沉浸式 ===== */
        <div
          style={{ height: '100%', position: 'relative', zIndex: 1 }}
          onClick={toggleUI}
        >
          {/* 顶部进度条 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'rgba(255,255,255,0.05)', zIndex: 20,
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(88,86,214,0.8), rgba(255,107,107,0.8))',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* 顶部 UI */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: isMobile ? '16px 20px' : '20px 32px',
            background: 'linear-gradient(180deg, rgba(10,10,12,0.95) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: showUI ? 1 : 0,
            transform: showUI ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.4s ease',
            pointerEvents: showUI ? 'auto' : 'none',
            zIndex: 10,
          }} onClick={e => e.stopPropagation()}>
            <button onClick={handleBack} style={{
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>‹</span> 返回
            </button>
            <span style={{
              fontSize: 12, color: 'rgba(255,255,255,0.4)',
              fontFamily: '"Noto Serif SC", serif',
              maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{selectedNovel.title}</span>
            <button onClick={() => setShowChapterList(true)} style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>目录</button>
          </div>

          {/* 阅读内容 */}
          <div
            ref={scrollRef}
            style={{
              height: '100%', overflowY: 'auto',
              padding: isMobile ? '80px 28px 140px' : '100px 40px 160px',
            }}
            onClick={e => e.stopPropagation()}
            onScroll={resetHideTimer}
          >
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {/* 章节标题 */}
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <span style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                }}>Chapter {String(currentChapter + 1).padStart(2, '0')}</span>
                <h2 style={{
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: 16,
                  fontFamily: '"Noto Serif SC", serif',
                  letterSpacing: '0.08em',
                  lineHeight: 1.4,
                }}>{chapter?.title}</h2>
                <div style={{
                  width: 40, height: 1, margin: '24px auto 0',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }} />
              </div>

              {/* 正文 */}
              <div style={{
                fontSize: isMobile ? 16 : 17,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 2.4,
                fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
                letterSpacing: '0.02em',
              }}>
                {chapter?.content.split('\n\n').map((para, idx) => (
                  <p key={idx} style={{ marginBottom: '2em', textIndent: '2em' }}>
                    {para.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < para.split('\n').length - 1 && <br />}</span>
                    ))}
                  </p>
                ))}
              </div>

              {/* 章节结束装饰 */}
              <div style={{ textAlign: 'center', margin: '64px 0 32px' }}>
                <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>✦</span>
              </div>
            </div>
          </div>

          {/* 底部导航 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '24px' : '32px',
            background: 'linear-gradient(0deg, rgba(10,10,12,0.98) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
            opacity: showUI ? 1 : 0,
            transform: showUI ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease',
            pointerEvents: showUI ? 'auto' : 'none',
            zIndex: 10,
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { if (currentChapter > 0) setCurrentChapter(c => c - 1) }}
              disabled={currentChapter === 0}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: currentChapter === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${currentChapter === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)'}`,
                color: currentChapter === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                fontSize: 20, cursor: currentChapter === 0 ? 'default' : 'pointer',
                transition: 'all 0.3s',
              }}
            >‹</button>
            
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                {currentChapter + 1} / {selectedNovel.chapters.length}
              </div>
              <div style={{
                width: 80, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'linear-gradient(90deg, #5856d6, #ff6b6b)',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
            
            <button
              onClick={() => { if (currentChapter < selectedNovel.chapters.length - 1) setCurrentChapter(c => c + 1) }}
              disabled={currentChapter === selectedNovel.chapters.length - 1}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: currentChapter === selectedNovel.chapters.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${currentChapter === selectedNovel.chapters.length - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)'}`,
                color: currentChapter === selectedNovel.chapters.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                fontSize: 20, cursor: currentChapter === selectedNovel.chapters.length - 1 ? 'default' : 'pointer',
                transition: 'all 0.3s',
              }}
            >›</button>
          </div>

          {/* 目录抽屉 */}
          {showChapterList && (
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                zIndex: 30,
              }}
              onClick={() => setShowChapterList(false)}
            >
              <div
                style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0,
                  width: isMobile ? '85%' : 320,
                  background: 'linear-gradient(135deg, rgba(20,20,25,0.98) 0%, rgba(15,15,18,0.98) 100%)',
                  borderLeft: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column',
                  animation: 'slideIn 0.3s ease',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{
                  padding: '24px 28px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <h3 style={{
                    fontSize: 16, fontWeight: 400,
                    color: 'rgba(255,255,255,0.9)',
                    fontFamily: '"Noto Serif SC", serif',
                  }}>目录</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {selectedNovel.chapters.length} 章节
                  </p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {selectedNovel.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentChapter(idx); setShowChapterList(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: '100%', padding: '14px 28px',
                        textAlign: 'left',
                        background: idx === currentChapter ? 'rgba(88,86,214,0.15)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        fontSize: 10, color: idx === currentChapter ? 'rgba(88,86,214,0.9)' : 'rgba(255,255,255,0.2)',
                        fontFamily: 'Georgia, serif',
                        minWidth: 20,
                      }}>{String(idx + 1).padStart(2, '0')}</span>
                      <span style={{
                        fontSize: 13,
                        color: idx === currentChapter ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                      }}>{ch.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
