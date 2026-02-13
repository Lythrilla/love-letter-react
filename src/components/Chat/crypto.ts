// AES-256-GCM 端到端加密

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

// 从密码派生密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// 加密消息
export async function encryptMessage(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  )

  // 格式: salt(16) + iv(12) + ciphertext
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...result))
}

// 解密消息
export async function decryptMessage(ciphertext: string, password: string): Promise<string> {
  try {
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    
    // 检查是否是有效的加密格式（至少需要 salt + iv + 一些密文）
    if (data.length < 29) {
      return ciphertext // 太短，可能是明文
    }
    
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const encrypted = data.slice(28)

    const key = await deriveKey(password, salt)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )

    return new TextDecoder().decode(decrypted)
  } catch {
    // 解密失败，返回原文（可能是管理员发送的明文消息）
    return ciphertext
  }
}
