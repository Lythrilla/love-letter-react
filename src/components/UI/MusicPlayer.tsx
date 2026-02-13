import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { throttle, formatTime } from '../../utils'

let bgmUrl = ''
try {
  bgmUrl = new URL('../../music/bgm.mp3', import.meta.url).href
} catch {
  console.warn('背景音乐文件不存在: src/music/bgm.mp3')
}

export const MusicPlayer = memo(function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const setMusicState = useAppStore((s) => s.setMusicState)
  const musicStarted = useAppStore((s) => s.musicStarted)
  const phase = useAppStore((s) => s.phase)
  const bgmFadeOut = useAppStore((s) => s.bgmFadeOut)
  const hasStarted = useRef(false)

  // 当 musicStarted 变为 true 时播放音乐
  useEffect(() => {
    if (musicStarted && !hasStarted.current && audioRef.current) {
      audioRef.current.play().then(() => {
        hasStarted.current = true
        setIsPlaying(true)
        setMusicState(0, true)
      }).catch(() => {})
    }
  }, [musicStarted, setMusicState])

  // 监听 bgmFadeOut 渐出并停止背景音乐
  useEffect(() => {
    if (bgmFadeOut && audioRef.current && isPlaying) {
      const audio = audioRef.current
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05)
        } else {
          audio.pause()
          audio.volume = 0
          setIsPlaying(false)
          clearInterval(fadeOut)
        }
      }, 100)
      return () => clearInterval(fadeOut)
    }
  }, [bgmFadeOut, isPlaying])

  // 节流状态同步
  const throttledSetMusicState = useMemo(
    () => throttle((time: number, playing: boolean) => setMusicState(time, playing), 100),
    [setMusicState]
  )
  
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      throttledSetMusicState(time, !audioRef.current.paused)
    }
  }, [isDragging, throttledSetMusicState])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setMusicState(audioRef.current.currentTime, false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      setMusicState(audioRef.current.currentTime, true)
    }
  }, [isPlaying, setMusicState])

  const seekTo = useCallback((clientX: number) => {
    if (!progressRef.current || !audioRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setMusicState(newTime, isPlaying)
  }, [duration, isPlaying, setMusicState])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    seekTo(e.clientX)
  }, [seekTo])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    seekTo(e.clientX)
  }, [seekTo])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => seekTo(e.clientX)
    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, seekTo])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const expanded = isHovered || isDragging

  // start 和 ending 阶段只渲染 audio 元素
  if (phase === 'start' || phase === 'ending') {
    return bgmUrl ? (
      <audio 
        ref={audioRef} 
        src={bgmUrl} 
        loop 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
    ) : null
  }

  // 如果没有音乐文件，不渲染组件
  if (!bgmUrl) {
    return null
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        src={bgmUrl} 
        loop 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      <div
        className={`music-player ${expanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isDragging && setIsHovered(false)}
      >
        {/* 播放/暂停按钮 */}
        <button className="music-player-btn" onClick={togglePlay}>
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isPlaying && !expanded && (
            <span className="music-wave playing" />
          )}
        </button>

        {/* 进度条区域 */}
        <div className={`music-player-progress ${expanded ? '' : 'hidden'}`}>
          <div
            ref={progressRef}
            className="music-player-bar"
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
          >
            <div 
              className="music-player-bar-fill"
              style={{ 
                width: `${progress}%`,
                transition: isDragging ? 'none' : 'width 0.1s linear'
              }}
            />
            <div 
              className="music-player-bar-thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="music-player-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </>
  )
})
