import { useState, useCallback } from 'react'

export interface Message {
  id: string
  content: string
  sender: string
  timestamp: number
  type?: 'text' | 'image'
  decrypted?: string
}

interface UseChatOptions {
  sender: string
}

const STORAGE_KEY = 'local-chat-messages'

// 从本地存储加载消息
function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// 保存消息到本地存储
function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch (e) {
    console.error('保存消息失败', e)
  }
}

export function useChat(options: UseChatOptions) {
  const { sender } = options
  
  const [messages, setMessages] = useState<Message[]>(loadMessages())
  const [isConnected] = useState(true)
  const [error] = useState<string | null>(null)

  // 发送消息（仅本地存储）
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' = 'text') => {
    if (!content.trim()) return false

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender,
      timestamp: Date.now(),
      type,
      decrypted: content,
    }
    
    setMessages(prev => {
      const updated = [...prev, newMsg]
      saveMessages(updated)
      return updated
    })
    
    return true
  }, [sender])

  // 空函数保持接口兼容
  const startPolling = useCallback(() => {}, [])
  const stopPolling = useCallback(() => {}, [])

  return {
    messages,
    isConnected,
    error,
    retryCount: 0,
    sendMessage,
    startPolling,
    stopPolling,
  }
}
