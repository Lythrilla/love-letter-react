import { memo } from 'react'
import { useAppStore } from '../../store/useAppStore'

export const BackToStories = memo(function BackToStories() {
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const setCurrentStoryIndex = useAppStore((s) => s.setCurrentStoryIndex)

  if (phase !== 'ready' && phase !== 'reading') return null

  const handleBack = () => {
    setCurrentStoryIndex(0)
    setPhase('stories')
  }

  return (
    <button
      onClick={handleBack}
      className="fixed top-5 left-5 z-50 transition-opacity duration-300 hover:opacity-100"
      style={{ opacity: 0.4 }}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
})
