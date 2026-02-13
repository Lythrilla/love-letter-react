import { useAppStore } from '../../store/useAppStore'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { isMobile } from '../../utils'
import endingAudioUrl from '../../assets/ending.mp3'
import creditsAudioUrl from '../../assets/credits.mp3'

// 静态导入所有结尾照片（模块级缓存）
const endingPhotoModules = import.meta.glob<string>('../../photos/*.webp', { eager: true, query: '?url', import: 'default' })

// 过滤掉人像照片，只保留普通照片用于走马灯
const ALL_ENDING_PHOTOS = Object.entries(endingPhotoModules)
  .filter(([path]) => !path.includes('baobao.webp'))
  .map(([, url]) => url)

// 导入人像图片
const portraitModules = import.meta.glob<string>('../../photos/baobao.webp', { eager: true, query: '?url', import: 'default' })
const portraitUrl = Object.values(portraitModules)[0] || ''

export function EndingScreen() {
  const phase = useAppStore((s) => s.phase)
  const setPhotosFading = useAppStore((s) => s.setPhotosFading)
  const containerRef = useRef<HTMLDivElement>(null)
  const endingAudioRef = useRef<HTMLAudioElement | null>(null)
  const creditsAudioRef = useRef<HTMLAudioElement | null>(null)
  const [blinkPhase, setBlinkPhase] = useState(0) // 0: 等待, 1-4: 闪烁, 5: 走马灯
  const [showGallery, setShowGallery] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMoreText, setShowMoreText] = useState(false)
  const [blinkBeforeFade, setBlinkBeforeFade] = useState(0) // 0: 无, 1-3: 眨眼
  const [showEnding, setShowEnding] = useState(false)
  const [showPortrait, setShowPortrait] = useState(false)
  const [galleryLyricIndex, setGalleryLyricIndex] = useState(-1)
  
  const galleryLyrics = [
    { time: 4, text: '我们好不容易' },
    { time: 6, text: '我们身不由己' },
    { time: 11, text: '我怕时间太快' },
    { time: 13, text: '不够将你看仔细' },
    { time: 18, text: '我怕时间太慢' },
    { time: 20, text: '日夜担心失去你' },
    { time: 25, text: '恨不得一夜之间白头' },
    { time: 29, text: '永不分离' },
  ]
  
  const photos = ALL_ENDING_PHOTOS
  
  // 眨眼后停止背景音乐
  const setBgmFadeOut = useAppStore((s) => s.setBgmFadeOut)
  useEffect(() => {
    if (phase === 'ending' && blinkPhase >= 2) {
      setBgmFadeOut(true)
    }
  }, [phase, blinkPhase, setBgmFadeOut])

  // 结尾音乐渐入播放（走马灯开始时）
  const setHideLyrics = useAppStore((s) => s.setHideLyrics)
  const [endingAudioDone, setEndingAudioDone] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioLoaded, setAudioLoaded] = useState(false)
  
  useEffect(() => {
    if (phase !== 'ending' || blinkPhase < 5) return
    
    // 隐藏歌词
    setHideLyrics(true)
    
    const audio = new Audio(endingAudioUrl)
    audio.volume = 0
    endingAudioRef.current = audio
    
    // 音频加载完成
    audio.onloadedmetadata = () => {
      setAudioLoaded(true)
    }
    
    // 音频播放完毕后标记
    audio.onended = () => {
      setEndingAudioDone(true)
    }
    
    // 更新当前播放时间
    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime)
    }
    
    audio.play().then(() => {
      // 3秒渐入
      const fadeIn = setInterval(() => {
        if (audio.volume < 0.8) {
          audio.volume = Math.min(0.8, audio.volume + 0.02)
        } else {
          clearInterval(fadeIn)
        }
      }, 60)
    }).catch(() => {})
    
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [phase, blinkPhase, setHideLyrics])

  // 闪烁效果（眨眼）
  useEffect(() => {
    if (phase !== 'ending' || !showGallery || blinkPhase >= 5) return
    
    // 模拟眨眼节奏
    const delays = [1800, 1250, 1600, 1250, 1400] // 睁-闭-睁-闭-睁
    const timer = setTimeout(() => {
      setBlinkPhase(p => p + 1)
    }, delays[blinkPhase] || 300)
    
    return () => clearTimeout(timer)
  }, [phase, showGallery, blinkPhase])

  // 走马灯歌词同步 - 使用音频实际播放时间，如果音频未播放则使用备用计时器
  useEffect(() => {
    if (phase !== 'ending' || !showGallery || blinkPhase < 5) return
    
    // 备用计时器：如果音频没有播放（audioCurrentTime 一直是 0），使用独立计时器
    let startTime = Date.now()
    let fallbackTimer: number | null = null
    
    const updateLyricIndex = (currentTime: number) => {
      let idx = -1
      for (let i = galleryLyrics.length - 1; i >= 0; i--) {
        if (currentTime >= galleryLyrics[i].time) {
          idx = i
          break
        }
      }
      setGalleryLyricIndex(idx)
    }
    
    // 如果音频正在播放，使用音频时间
    if (audioCurrentTime > 0) {
      updateLyricIndex(audioCurrentTime)
    } else {
      // 否则使用备用计时器（每 100ms 更新一次）
      fallbackTimer = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        updateLyricIndex(elapsed)
      }, 100)
    }
    
    return () => {
      if (fallbackTimer) clearInterval(fallbackTimer)
    }
  }, [phase, showGallery, blinkPhase, audioCurrentTime, galleryLyrics])

  // 走马灯效果 - 根据音频时长自动调整速度
  useEffect(() => {
    if (phase !== 'ending' || !showGallery || blinkPhase < 5 || !audioLoaded) return
    
    // 如果没有图片，直接跳到结尾
    if (photos.length === 0) {
      setShowGallery(false)
      setPhotosFading(true)
      return
    }
    
    // 获取音频时长
    const audioDuration = endingAudioRef.current?.duration || 33 // 默认 33 秒
    const galleryDuration = audioDuration - 5 // 留 5 秒给结尾文字
    const intervalTime = Math.max(50, Math.floor((galleryDuration * 1000) / photos.length))
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= photos.length - 1) {
          clearInterval(interval)
          // 显示"还有好多照片"提示
          setShowMoreText(true)
          setTimeout(() => {
            setShowMoreText(false)
            // 开始眨眼效果
            setBlinkBeforeFade(1)
          }, 1800)
          return prev
        }
        return prev + 1
      })
    }, intervalTime)
    
    return () => clearInterval(interval)
  }, [phase, showGallery, blinkPhase, photos.length, setPhotosFading, audioLoaded])

  // 走马灯后的眨眼效果
  useEffect(() => {
    if (phase !== 'ending' || blinkBeforeFade === 0 || blinkBeforeFade > 4) return
    
    // 眨眼节奏：闭-睁-闭-睁（和第一次一样的间隔）
    const delays = [1250, 1600, 1250, 1400]
    const timer = setTimeout(() => {
      if (blinkBeforeFade >= 4) {
        // 眨眼完成，触发粒子消散
        setShowGallery(false)
        setPhotosFading(true)
        setBlinkBeforeFade(99) // 标记完成，退出眨眼渲染
      } else {
        setBlinkBeforeFade(b => b + 1)
      }
    }, delays[blinkBeforeFade - 1] || 300)
    
    return () => clearTimeout(timer)
  }, [phase, blinkBeforeFade, setPhotosFading])

  // 音频播放完毕后进入字幕
  useEffect(() => {
    if (phase !== 'ending' || !endingAudioDone) return
    
    // 等待一小会儿再进入字幕
    const timer = setTimeout(() => {
      setShowEnding(true)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [phase, endingAudioDone])

  // 滚动字幕阶段播放新音频
  useEffect(() => {
    if (phase !== 'ending' || !showEnding) return
    
    const audio = new Audio(creditsAudioUrl)
    audio.volume = 0
    creditsAudioRef.current = audio
    
    audio.play().then(() => {
      const fadeIn = setInterval(() => {
        if (audio.volume < 0.6) {
          audio.volume = Math.min(0.6, audio.volume + 0.02)
        } else {
          clearInterval(fadeIn)
        }
      }, 80)
    }).catch(() => {})
    
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [phase, showEnding])

  // 结尾文字动画
  useEffect(() => {
    if (phase !== 'ending' || !showEnding || !containerRef.current) return

    const elements = containerRef.current.querySelectorAll('.fade-in')
    gsap.set(elements, { opacity: 0 })
    
    gsap.to(elements, {
      opacity: 1,
      duration: 1.2,
      stagger: 0.8,
      delay: 0.3,
      ease: 'power2.out'
    })
  }, [phase, showEnding])

  // 人像图片（在结尾文字显示后）
  useEffect(() => {
    if (phase !== 'ending' || !showEnding) return
    
    // 等待文字动画完成后显示人像（约5秒）
    const timer = setTimeout(() => {
      setShowPortrait(true)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [phase, showEnding])

  // 重置状态
  useEffect(() => {
    if (phase === 'ending') {
      setBlinkPhase(0)
      setShowGallery(true)
      setCurrentIndex(0)
      setShowMoreText(false)
      setShowEnding(false)
      setShowPortrait(false)
    } else {
      setPhotosFading(false)
    }
  }, [phase, setPhotosFading])

  if (phase !== 'ending') return null

  // 闪烁阶段（眨眼）
  if (showGallery && blinkPhase < 5) {
    const isBlack = blinkPhase === 1 || blinkPhase === 3
    return (
      <div 
        className="fixed inset-0 z-50"
        style={{
          background: isBlack ? 'rgba(0,0,0,1)' : 'transparent',
          transition: 'background 0.15s ease',
        }}
      />
    )
  }

  // 走马灯阶段
  if (showGallery && blinkBeforeFade === 0) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.9)' }}
      >
        {!showMoreText ? (
          <>
            <img
              src={photos[currentIndex]}
              alt=""
              style={{
                maxWidth: isMobile ? '85vw' : '70vw',
                maxHeight: isMobile ? '60vh' : '70vh',
                objectFit: 'contain',
                filter: 'blur(3px)',
                opacity: 0.7,
              }}
            />
            {/* 走马灯歌词 - 书法艺术字，始终居中 */}
            {galleryLyricIndex >= 0 && (
              <p
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: '"Ma Shan Zheng", "Noto Serif SC", cursive',
                  fontSize: isMobile ? '32px' : '48px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.95)',
                  letterSpacing: '0.15em',
                  textShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.7), 0 2px 20px rgba(0,0,0,0.8)',
                  textAlign: 'center',
                  zIndex: 10,
                  transition: 'opacity 0.5s ease',
                  padding: '0 2rem',
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                  borderRadius: '20px',
                }}
              >
                {galleryLyrics[galleryLyricIndex].text}
              </p>
            )}
          </>
        ) : (
          <>
            {/* 歌词居中 */}
            {galleryLyricIndex >= 0 && (
              <p
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: '"Ma Shan Zheng", "Noto Serif SC", cursive',
                  fontSize: isMobile ? '28px' : '42px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)',
                  letterSpacing: '0.15em',
                  textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                  textAlign: 'center',
                  transition: 'opacity 0.3s ease',
                }}
              >
                {galleryLyrics[galleryLyricIndex].text}
              </p>
            )}
            {/* "还有好多照片"在下面 */}
            <p
              style={{
                position: 'absolute',
                bottom: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: '"Noto Serif SC", serif',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.1em',
                padding: '0 1.5rem',
                textAlign: 'center',
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              还有好多照片没有放上来...
            </p>
          </>
        )}
      </div>
    )
  }

  // 走马灯后的眨眼效果（粒子前）
  if (blinkBeforeFade >= 1 && blinkBeforeFade <= 4) {
    const isBlack = blinkBeforeFade === 1 || blinkBeforeFade === 3
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: isBlack ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.9)',
          transition: 'background 0.15s ease',
        }}
      >
        {/* 继续显示歌词 */}
        {galleryLyricIndex >= 0 && (
          <p
            style={{
              fontFamily: '"Ma Shan Zheng", "Noto Serif SC", cursive',
              fontSize: isMobile ? '28px' : '42px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '0.15em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              textAlign: 'center',
            }}
          >
            {galleryLyrics[galleryLyricIndex].text}
          </p>
        )}
      </div>
    )
  }

  if (!showEnding) {
    return (
      <div 
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center" 
        style={{ background: 'transparent' }}
      >
        {/* 继续显示歌词 */}
        {galleryLyricIndex >= 0 && (
          <p
            style={{
              fontFamily: '"Ma Shan Zheng", "Noto Serif SC", cursive',
              fontSize: isMobile ? '28px' : '42px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '0.15em',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              textAlign: 'center',
            }}
          >
            {galleryLyrics[galleryLyricIndex].text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex"
      style={{ transition: 'all 1s ease-out' }}
    >
      {/* 左侧滚动字幕区 */}
      <div 
        style={{
          width: isMobile ? '100%' : '50%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 顶部渐变遮罩 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to bottom, rgba(5,5,8,1) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />
        
        {/* 底部渐变遮罩 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to top, rgba(5,5,8,1) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />

        {/* 滚动内容 */}
        <div
          style={{
            animation: 'creditsScroll 137s linear forwards',
            fontFamily: '"Noto Serif SC", Georgia, serif',
            color: 'rgba(255, 255, 255, 0.65)',
            padding: isMobile ? '0 2.5rem' : '0 5rem',
            paddingTop: '100vh',
            maxWidth: '500px',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 400, lineHeight: 2.2, marginBottom: '8rem' }}>
            谢谢你看到这里
          </p>

          <p style={{ fontSize: '22px', fontWeight: 400, lineHeight: 2, color: 'rgba(255, 255, 255, 0.85)', marginBottom: '15rem' }}>
            遇见你，是最美的意外
          </p>

          <p style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.2em', color: 'rgba(255, 255, 255, 0.35)', marginBottom: '4rem' }}>
            MAKING OF
          </p>

          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.55)', marginBottom: '12rem' }}>
            这封信写了好几天<br />
            翻聊天记录的时候发现<br />
            我们的回忆比想象中多很多
          </p>

          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.55)', marginBottom: '12rem' }}>
            写代码的时候一直循环那首歌<br />
            鬼知道循环多少次<br />
            不过反正是哭了好几次<br />
            不知道你有没有发现很多音乐的小心机<br />
            是我一点一点调出来的<br />
            这个不能自动对时间<br />
            只能一点一点改
          </p>

          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.55)', marginBottom: '12rem' }}>
            这个谢幕音乐也是我写的<br />
            当然是致你的<br />
            就叫？<br />
            《致那个把回忆熬成星光的你》<br />
            怎么样？
          </p>

          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.55)', marginBottom: '12rem' }}>
            有你在的日子<br />
            连空气都是甜的
          </p>

          <p style={{ fontSize: '18px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '12rem', marginTop: '10rem' }}>
            不管未来怎样<br />
            这段时光我会永远记得
          </p>

          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 2.2, color: 'rgba(255, 255, 255, 0.55)', marginBottom: '12rem' }}>
            只是想到这冗长的一生<br />
            无法再与你相见<br />
            难免哽咽
          </p>

          <p style={{ fontSize: '20px', fontWeight: 400, lineHeight: 2, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '15rem' }}>
            你是我写过最美的故事
          </p>

          <div style={{ marginTop: '15rem' }}>
            <p style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.8rem' }}>
              永远爱你的
            </p>
            <p style={{ fontSize: '24px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.75)', letterSpacing: '0.08em' }}>
              浩浩
            </p>
          </div>

          <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '0.5em', color: 'rgba(255, 255, 255, 0.3)', marginTop: '25rem' }}>
            晚安
          </p>

          <div style={{ height: '20vh' }} />
        </div>
      </div>

      {/* 右侧人像区（桌面端） */}
      {showPortrait && !isMobile && (
        <div 
          style={{
            width: '50%',
            height: '100%',
            position: 'relative',
            animation: 'fadeIn 2s ease-out forwards',
          }}
        >
          <img 
            src={portraitUrl} 
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.85,
            }}
          />
        </div>
      )}
    </div>
  )
}
