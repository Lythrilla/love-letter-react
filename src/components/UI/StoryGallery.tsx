import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getPhotoStory } from '../../config/photoStories'
import gsap from 'gsap'
import { isMobile } from '../../utils'
import { STORY_PHOTOS } from '../../utils/photos'

export function StoryGallery() {
  const phase = useAppStore((s) => s.phase)
  const currentStoryIndex = useAppStore((s) => s.currentStoryIndex)
  const setCurrentStoryIndex = useAppStore((s) => s.setCurrentStoryIndex)
  const setPhase = useAppStore((s) => s.setPhase)
  
  const [displayIndex, setDisplayIndex] = useState(currentStoryIndex)
  const [entered, setEntered] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)
  
  const storyCount = STORY_PHOTOS.length
  const currentPhoto = STORY_PHOTOS[displayIndex]
  const story = currentPhoto ? getPhotoStory(currentPhoto) : null

  // 进入/离开时重置状态
  useEffect(() => {
    if (phase === 'stories') {
      setDisplayIndex(currentStoryIndex)
      setShowTransition(false)
      if (contentRef.current) {
        contentRef.current.style.visibility = 'visible'
        contentRef.current.style.opacity = '1'
      }
    } else {
      setEntered(false)
      setShowTransition(false)
    }
  }, [phase])

  useEffect(() => {
    if (!showTransition || !transitionRef.current) return
    
    if (contentRef.current) {
      gsap.to(contentRef.current, { 
        opacity: 0, 
        duration: 0.3,
        onComplete: () => {
          if (contentRef.current) {
            contentRef.current.style.visibility = 'hidden'
          }
        }
      })
    }
    if (containerRef.current) {
      const bottomControls = containerRef.current.querySelector('.bottom-controls')
      if (bottomControls) {
        gsap.to(bottomControls, { opacity: 0, duration: 0.3 })
      }
    }
    
    gsap.fromTo(transitionRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, delay: 0.5 }
    )
    
    const timer = setTimeout(() => {
      gsap.to(transitionRef.current, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => setPhase('ready')
      })
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [showTransition, setPhase])

  useEffect(() => {
    if (phase !== 'stories' || entered) return
    if (!containerRef.current) return
    
    setEntered(true)
    
    if (contentRef.current) {
      contentRef.current.style.visibility = 'visible'
      contentRef.current.style.opacity = '1'
    }
    
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out' }
    )
  }, [phase, entered])

  useEffect(() => {
    if (!contentRef.current || !entered) return
    if (currentStoryIndex === displayIndex) return
    
    setIsAnimating(true)
    const direction = currentStoryIndex > displayIndex ? 1 : -1
    const content = contentRef.current
    
    gsap.to(content, {
      opacity: 0,
      y: direction * -25,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setDisplayIndex(currentStoryIndex)
        gsap.set(content, { y: direction * 30 })
        content.style.visibility = 'visible'
        gsap.to(content, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          onComplete: () => setIsAnimating(false)
        })
      }
    })
  }, [currentStoryIndex])

  useEffect(() => {
    if (phase !== 'stories') return
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (isAnimating || showTransition) return

      if (e.deltaY > 0) {
        if (currentStoryIndex < storyCount - 1) {
          setCurrentStoryIndex(currentStoryIndex + 1)
        } else {
          setShowTransition(true)
        }
      } else {
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(currentStoryIndex - 1)
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [phase, currentStoryIndex, storyCount, setCurrentStoryIndex, isAnimating, showTransition])

  const touchRef = useRef({ startY: 0, startX: 0, isSwiping: false })
  
  useEffect(() => {
    if (phase !== 'stories') return
    
    const handleTouchStart = (e: TouchEvent) => {
      touchRef.current.startY = e.touches[0].clientY
      touchRef.current.startX = e.touches[0].clientX
      touchRef.current.isSwiping = false
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating) return
      
      const deltaY = touchRef.current.startY - e.touches[0].clientY
      const deltaX = touchRef.current.startX - e.touches[0].clientX
      
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        e.preventDefault()
        touchRef.current.isSwiping = true
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimating || !touchRef.current.isSwiping) return
      
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchRef.current.startY - touchEndY
      
      if (Math.abs(deltaY) > 40) {
        if (deltaY > 0) {
          if (currentStoryIndex < storyCount - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1)
          } else if (!showTransition) {
            setShowTransition(true)
          }
        } else {
          if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1)
          }
        }
      }
      
      touchRef.current.isSwiping = false
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [phase, currentStoryIndex, storyCount, setCurrentStoryIndex, isAnimating, showTransition])

  useEffect(() => {
    if (phase !== 'stories') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        if (currentStoryIndex < storyCount - 1) {
          setCurrentStoryIndex(currentStoryIndex + 1)
        } else if (!showTransition) {
          setShowTransition(true)
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(currentStoryIndex - 1)
        }
      } else if (e.key === 'Escape') {
        setPhase('ready')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentStoryIndex, storyCount, setCurrentStoryIndex, setPhase, isAnimating, showTransition])

  if (phase !== 'stories' || storyCount === 0) return null

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden" 
      style={{ opacity: 0, touchAction: 'none' }}
    >
      <div 
        ref={contentRef}
        className="relative h-full"
        style={{ opacity: 1 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={currentPhoto} 
            alt=""
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: story?.objectPosition || 'center center',
              borderRadius: '8px',
              transform: `scale(${story?.scale || 0.85})`,
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.85) 100%)',
            }}
          />
        </div>

        {story && (
          <div 
            className="absolute bottom-0 left-0 right-0"
            style={{ 
              padding: isMobile ? '0 24px 120px' : '0 48px 140px',
            }}
          >
            <div style={{ maxWidth: '600px' }}>
              {story.date && (
                <div 
                  style={{ 
                    display: 'inline-block',
                    fontSize: '11px', 
                    color: '#fff',
                    background: 'rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {story.date}
                </div>
              )}
              {story.title && (
                <h2 style={{ 
                  fontSize: isMobile ? '24px' : '32px',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: '12px',
                  lineHeight: 1.3,
                  letterSpacing: '-0.02em',
                }}>
                  {story.title}
                </h2>
              )}
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {story.content}
              </p>
            </div>
          </div>
        )}
      </div>

      {!showTransition && (
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-auto"
          style={{ 
            padding: isMobile ? '24px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              {String(currentStoryIndex + 1).padStart(2, '0')}
            </span>
            <div 
              style={{ 
                width: '60px', 
                height: '2px', 
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '1px',
              }}
            >
              <div 
                style={{ 
                  width: `${((currentStoryIndex + 1) / storyCount) * 100}%`,
                  height: '100%',
                  background: '#fff',
                  borderRadius: '1px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              {String(storyCount).padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => currentStoryIndex > 0 && setCurrentStoryIndex(currentStoryIndex - 1)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                color: currentStoryIndex > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentStoryIndex > 0 ? 'pointer' : 'default',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => {
                if (currentStoryIndex < storyCount - 1) {
                  setCurrentStoryIndex(currentStoryIndex + 1)
                } else {
                  setShowTransition(true)
                }
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                color: '#000',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {!showTransition && (
        <button
          onClick={() => setPhase('ready')}
          className="absolute pointer-events-auto"
          style={{
            top: isMobile ? '20px' : '28px',
            right: isMobile ? '20px' : '28px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          跳过 ›
        </button>
      )}

      {showTransition && (
        <div
          ref={transitionRef}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ 
            opacity: 0,
            background: '#000', // 纯黑背景完全遮挡
            zIndex: 60, // 确保在图片上层
          }}
        >
          <p
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              fontWeight: 300,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '0.3em',
            }}
          >
            来看看那些碎片吧
          </p>
        </div>
      )}
    </div>
  )
}
