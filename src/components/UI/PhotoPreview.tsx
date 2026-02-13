import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getPhotoStory } from '../../config/photoStories'
import { CHAT_TRIGGER_PHOTO, isPhotoMatch } from '../../config/chatTrigger'

export function PhotoPreview() {
  const previewPhoto = useAppStore((s) => s.previewPhoto)
  const setPreviewPhoto = useAppStore((s) => s.setPreviewPhoto)
  const setShowChat = useAppStore((s) => s.setShowChat)

  // 检测是否点击了特定照片
  useEffect(() => {
    if (previewPhoto && isPhotoMatch(previewPhoto, CHAT_TRIGGER_PHOTO)) {
      // 关闭预览，打开聊天
      setPreviewPhoto(null)
      setShowChat(true)
    }
  }, [previewPhoto, setPreviewPhoto, setShowChat])

  if (!previewPhoto) return null

  const story = getPhotoStory(previewPhoto)

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={() => setPreviewPhoto(null)}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={previewPhoto}
          alt=""
          style={{
            maxWidth: '85vw',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />
        
        {story && (
          <div className="mt-4 text-center max-w-lg">
            <h3 style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px',
            }}>
              {story.title}
            </h3>
            <p style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.8,
            }}>
              {story.content}
            </p>
          </div>
        )}
        
        {/* 关闭按钮 */}
        <button
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
