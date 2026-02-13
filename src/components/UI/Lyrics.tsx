import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { binarySearch } from '../../utils'
import lrcText from '../../assets/lyrics.lrc?raw'

interface LyricLine {
  time: number
  text: string
}

// LRC 时间戳正则
const LRC_TIME_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split('\n')
  const result: LyricLine[] = []

  for (const line of lines) {
    const match = LRC_TIME_REGEX.exec(line)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const milliseconds = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1)
      const time = minutes * 60 + seconds + milliseconds / 1000
      const text = line.replace(LRC_TIME_REGEX, '').trim()
      
      if (text && !text.includes('词：') && !text.includes('曲：') && !text.includes(' - ')) {
        result.push({ time, text })
      }
    }
  }
  return result
}

// 查找当前歌词索引（使用共享的二分查找）
const findLyricIndex = (lyrics: LyricLine[], time: number) => 
  binarySearch(lyrics, (item) => item.time <= time)

export const Lyrics = memo(function Lyrics() {
  const currentTime = useAppStore((s) => s.currentTime)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const hideLyrics = useAppStore((s) => s.hideLyrics)
  
  const lyrics = useMemo(() => parseLrc(lrcText), [])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [displayText, setDisplayText] = useState('')
  const [textVisible, setTextVisible] = useState(false)
  const prevIndexRef = useRef(-1)
  
  const LYRICS_OFFSET = 0.5
  
  useEffect(() => {
    if (!isPlaying || lyrics.length === 0) {
      setCurrentIndex(-1)
      setTextVisible(false)
      prevIndexRef.current = -1
      return
    }

    const adjustedTime = currentTime + LYRICS_OFFSET
    const newIndex = findLyricIndex(lyrics, adjustedTime)

    if (newIndex !== prevIndexRef.current && newIndex >= 0) {
      prevIndexRef.current = newIndex
      
      // 淡出当前文字
      setTextVisible(false)
      
      // 等淡出完成后更新并淡入
      setTimeout(() => {
        setCurrentIndex(newIndex)
        setDisplayText(lyrics[newIndex]?.text || '')
        setTimeout(() => setTextVisible(true), 20)
      }, 180)
    }
  }, [currentTime, lyrics, isPlaying])

  if (!isPlaying || currentIndex < 0 || hideLyrics) return null
  if (!displayText) return null

  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* 歌词容器 */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '8px 20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '36px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 文字 */}
        <span 
          style={{
            fontFamily: '"Noto Serif SC", serif',
            fontSize: '13px',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.85)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(3px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  )
})
