import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useChat } from './useChat'
import { compressImage, isValidImageType } from './imageUtils'
import { isMobile } from '../../utils'

// 本地聊天，无需远程配置

export function ChatModal() {
  const showChat = useAppStore((s) => s.showChat)
  const setShowChat = useAppStore((s) => s.setShowChat)
  
  const [sender] = useState<'A' | 'B'>(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    return params.get('me') === 'B' ? 'B' : 'A'
  })
  const [inputText, setInputText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [initialScrollDone, setInitialScrollDone] = useState(false)

  const { messages, isConnected, error, sendMessage, startPolling, stopPolling } = useChat({
    sender,
  })

  // 打开/关闭聊天
  useEffect(() => {
    if (showChat) {
      startPolling()
      setInitialScrollDone(false)
    } else {
      stopPolling()
    }
  }, [showChat, startPolling, stopPolling])

  // ESC 关闭悬浮窗
  useEffect(() => {
    if (!showChat) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setShowChat(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [showChat, setShowChat])

  // 初始滚动到底部
  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      setInitialScrollDone(true)
    }
  }, [messages, initialScrollDone])

  // 新消息滚动到底部
  useEffect(() => {
    if (initialScrollDone && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, initialScrollDone])

  const handleSend = async () => {
    if (!inputText.trim()) return
    const text = inputText
    setInputText('')
    await sendMessage(text, 'text')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!isValidImageType(file)) {
      alert('请选择图片文件 (JPG/PNG/GIF/WebP)')
      return
    }
    
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      await sendMessage(compressed, 'image')
    } catch {
      alert('图片处理失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (!showChat) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowChat(false)
  }

  return (
    <div 
      className="fixed inset-0 z-[200] chat-modal-overlay"
      style={{ 
        background: 'linear-gradient(180deg, #07070c 0%, #050508 100%)',
        fontFamily: '"Noto Serif SC", serif',
      }}
      onClick={handleOverlayClick}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .chat-modal-overlay {
          animation: fadeIn 0.5s ease-out;
        }
        
        .chat-messages-area {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }
        .chat-messages-area::-webkit-scrollbar { width: 4px; }
        .chat-messages-area::-webkit-scrollbar-thumb { 
          background: rgba(255,255,255,0.06); 
          border-radius: 4px; 
        }
        
        .chat-image-preview {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .chat-image-preview img {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
        }
      `}</style>

      {/* 背景光效 */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(80, 60, 140, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* 主内容区 - 居中卡片 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '92%' : '85%',
          maxWidth: '900px',
          height: isMobile ? '85vh' : '80vh',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          background: 'rgba(10, 10, 16, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* 左侧 - 标题区 */}
        <div style={{
          flex: isMobile ? '0 0 auto' : '0 0 280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '40px 32px 24px' : '48px 40px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.04)',
          borderBottom: isMobile ? '1px solid rgba(255,255,255,0.04)' : 'none',
        }}>
          <div style={{
            fontSize: isMobile ? '56px' : '72px',
            marginBottom: isMobile ? '16px' : '24px',
            filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.04))',
            animation: 'float 4s ease-in-out infinite',
          }}>
            💌
          </div>

          <h1 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.88)',
            letterSpacing: '0.1em',
            marginBottom: isMobile ? '12px' : '20px',
            textAlign: 'center',
          }}>
            给浩浩发消息
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: isConnected ? 'rgba(120, 200, 150, 0.7)' : 'rgba(255, 255, 255, 0.25)',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isConnected ? 'rgba(120, 200, 150, 0.8)' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: isConnected ? '0 0 10px rgba(120, 200, 150, 0.4)' : 'none',
              animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            {isConnected ? '在线' : '离线'}
          </div>

          {!isMobile && (
            <p style={{
              marginTop: '32px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.2)',
              lineHeight: 2,
              textAlign: 'center',
              maxWidth: '180px',
            }}>
              发送的消息会被加密<br />只有我们能看到
            </p>
          )}
        </div>

        {/* 右侧 - 聊天区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          {/* 消息列表 */}
          <div 
            ref={messagesContainerRef}
            className="chat-messages-area"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '20px' : '28px 32px',
            }}
          >
            {error && (
              <div style={{ 
                color: 'rgba(255,150,150,0.6)', 
                fontSize: '11px', 
                marginBottom: '16px', 
                textAlign: 'center', 
                padding: '12px', 
                background: 'rgba(255,100,100,0.05)', 
                borderRadius: '8px' 
              }}>
                {error}
              </div>
            )}
            
            {messages.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.15)',
                gap: '16px',
              }}>
                <span style={{ fontSize: '32px', opacity: 0.5 }}>✨</span>
                <span style={{ fontSize: '12px', letterSpacing: '0.1em' }}>还没有消息</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>发送第一条消息吧</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender === sender
                const isImage = msg.type === 'image'
                const content = msg.decrypted || msg.content
                return (
                  <div key={msg.id} style={{
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: isImage ? '4px' : '12px 16px',
                      fontSize: '13px',
                      lineHeight: 1.9,
                      color: 'rgba(255, 255, 255, 0.8)',
                      background: isMine 
                        ? 'linear-gradient(135deg, rgba(120, 90, 160, 0.15), rgba(90, 120, 180, 0.12))'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isMine ? 'rgba(120, 100, 180, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {isImage ? (
                        <img 
                          src={content} 
                          alt="" 
                          style={{
                            maxWidth: '180px',
                            maxHeight: '180px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => setPreviewImage(content)}
                        />
                      ) : content}
                    </div>
                    <span style={{
                      fontSize: '9px',
                      color: 'rgba(255, 255, 255, 0.15)',
                      marginTop: '6px',
                      padding: '0 4px',
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div style={{
            padding: isMobile ? '16px 20px 20px' : '20px 32px 28px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '14px',
              padding: '10px 10px 10px 16px',
            }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: uploading ? 0.3 : 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={uploading ? '上传中...' : '写点什么...'}
                rows={1}
                disabled={uploading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 0',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '13px',
                  fontFamily: '"Noto Serif SC", serif',
                  resize: 'none',
                  outline: 'none',
                  minHeight: '22px',
                  maxHeight: '60px',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || uploading}
                style={{
                  width: '36px',
                  height: '36px',
                  background: (!inputText.trim() || uploading) 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, rgba(120, 100, 160, 0.3), rgba(100, 120, 180, 0.25))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: (!inputText.trim() || uploading) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={() => setShowChat(false)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '36px',
          height: '36px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '50%',
          color: 'rgba(255, 255, 255, 0.35)',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'
        }}
      >
        ×
      </button>

      {/* 底部提示 */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '9px',
        color: 'rgba(255,255,255,0.08)',
        letterSpacing: '0.12em',
      }}>
        ESC 关闭
      </div>
      
      {/* 图片预览 */}
      {previewImage && (
        <div className="chat-image-preview" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" />
        </div>
      )}
    </div>
  )
}
