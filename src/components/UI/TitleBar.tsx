import { useState } from 'react'

// 检测是否在 Tauri 环境中运行
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export function TitleBar() {
  const [hovered, setHovered] = useState<string | null>(null)

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().minimize()
    } catch {
      // 浏览器环境不支持
    }
  }

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      const isMaximized = await win.isMaximized()
      if (isMaximized) {
        await win.unmaximize()
      } else {
        await win.maximize()
      }
    } catch {
      // 浏览器环境不支持
    }
  }

  const handleClose = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('close_app')
    } catch (e) {
      console.error('Close error:', e)
      window.close()
    }
  }

  return (
    <div
      data-tauri-drag-region
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '32px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100,
        pointerEvents: 'none',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isTauri() && (
          <>
            <button
              onClick={handleMinimize}
              onMouseEnter={() => setHovered('min')}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '46px',
                height: '32px',
                border: 'none',
                background: hovered === 'min' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <svg width="10" height="1" viewBox="0 0 10 1">
                <rect fill="currentColor" width="10" height="1" />
              </svg>
            </button>

            <button
              onClick={handleMaximize}
              onMouseEnter={() => setHovered('max')}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '46px',
                height: '32px',
                border: 'none',
                background: hovered === 'max' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect stroke="currentColor" fill="none" width="9" height="9" x="0.5" y="0.5" />
              </svg>
            </button>
          </>
        )}

        <button
          onClick={handleClose}
          onMouseEnter={() => setHovered('close')}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: '46px',
            height: '32px',
            border: 'none',
            background: hovered === 'close' ? '#e81123' : 'transparent',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path stroke="currentColor" strokeWidth="1.2" d="M1,1 L9,9 M9,1 L1,9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
