export const CHAT_TRIGGER_PHOTO = 'IMG_20250901_002915.webp'

export function isPhotoMatch(url: string, target: string): boolean {
  const filename = url.split('/').pop()?.split('?')[0].split('#')[0] || ''
  if (filename === target) return true
  
  const ext = target.match(/(\.[^.]+)$/)?.[1] || ''
  const baseName = target.slice(0, -ext.length)
  return filename.startsWith(baseName) && filename.endsWith(ext)
}
