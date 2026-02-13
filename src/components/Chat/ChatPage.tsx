import { useState, useRef, useEffect } from 'react'
import { useChat } from './useChat'
import { compressImage, isValidImageType } from './imageUtils'

export default function ChatPage() {
  const [sender] = useState<'A' | 'B'>(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    return params.get('me') === 'B' ? 'B' : 'A'
  })
  const [inputText, setInputText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, isConnected, error, sendMessage, startPolling } = useChat({
    sender,
  })

  useEffect(() => {
    startPolling()
  }, [startPolling])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    } catch (err) {
      alert('图片处理失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-page">
      <style>{`
        .chat-page {
          position: fixed;
          inset: 0;
          background-color: var(--bg-dark, #050508);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        
        .chat-header {
          padding: 30px 10%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .chat-title {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }
        
        .chat-status {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.3);
        }
        .chat-status.online { color: rgba(150, 220, 180, 0.7); }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 40px 10%;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { 
          background: rgba(255,255,255,0.08); 
          border-radius: 3px; 
        }
        
        .chat-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.2);
          font-size: 13px;
          letter-spacing: 0.1em;
        }
        
        .chat-error {
          text-align: center;
          color: rgba(255, 150, 150, 0.6);
          font-size: 12px;
          margin-bottom: 20px;
        }
        
        .msg-wrapper {
          margin-bottom: 24px;
        }
        .msg-wrapper.mine {
          text-align: right;
        }
        
        .msg-bubble {
          display: inline-block;
          max-width: 65%;
          text-align: left;
          padding: 14px 20px;
          font-size: 14px;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.75);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
        .msg-wrapper.mine .msg-bubble {
          background: rgba(255, 150, 180, 0.06);
          border-color: rgba(255, 150, 180, 0.12);
          color: rgba(255, 255, 255, 0.85);
        }
        .msg-bubble.image {
          padding: 4px;
          background: transparent;
          border: none;
        }
        .msg-bubble img {
          max-width: 280px;
          max-height: 280px;
          border-radius: 2px;
          cursor: pointer;
        }
        .msg-wrapper.mine .msg-bubble.image {
          background: transparent;
          border: none;
        }
        
        .msg-time {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.2);
          margin-top: 8px;
          letter-spacing: 0.05em;
        }
        
        .chat-input-area {
          padding: 24px 10%;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .chat-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: 16px;
        }
        
        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          padding: 14px 18px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-family: 'Noto Serif SC', serif;
          resize: none;
          outline: none;
          min-height: 48px;
          max-height: 120px;
          transition: border-color 0.3s ease;
        }
        .chat-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .chat-input:focus {
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        .chat-send-btn {
          padding: 14px 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .chat-send-btn:not(:disabled):hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
        }
        .chat-send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .chat-img-btn {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .chat-img-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
        }
        .chat-img-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .image-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .image-preview-overlay img {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
        }
      `}</style>

      <header className="chat-header">
        <span className="chat-title">Private</span>
        <span className={`chat-status ${isConnected ? 'online' : ''}`}>
          {isConnected ? '● connected' : '○ offline'}
        </span>
      </header>

      <main className="chat-messages">
        {error && <div className="chat-error">{error}</div>}
        
        {messages.length === 0 ? (
          <div className="chat-empty">...</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender === sender
            const isImage = msg.type === 'image'
            const content = msg.decrypted || msg.content
            return (
              <div key={msg.id} className={`msg-wrapper ${isMine ? 'mine' : ''}`}>
                <div className={`msg-bubble ${isImage ? 'image' : ''}`}>
                  {isImage ? (
                    <img src={content} alt="" onClick={() => setPreviewImage(content)} />
                  ) : (
                    content
                  )}
                </div>
                <div className="msg-time">{formatTime(msg.timestamp)}</div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-input-area">
        <div className="chat-input-wrap">
          <button
            className="chat-img-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="发送图片"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? '上传中...' : '...'}
            rows={1}
            disabled={uploading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || uploading}
          >
            {uploading ? '...' : 'SEND'}
          </button>
        </div>
      </footer>
      
      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" />
        </div>
      )}
    </div>
  )
}
