export interface PhotoStory {
  title?: string
  content: string
  date?: string
  objectPosition?: string
  scale?: number
}

export const PHOTO_STORIES: Record<string, PhotoStory> = {
  'placeholder-1.webp': {
    title: '示例标题',
    content: '这是一个示例故事，你可以在这里写下你的回忆',
    date: '2024.01.01',
    scale: 1.0,
  },
}

const storyCache = new Map<string, PhotoStory | null>()

export function getPhotoStory(url: string): PhotoStory | null {

  if (storyCache.has(url)) {
    return storyCache.get(url)!
  }
  
  let filename = url.split('/').pop() || ''
  filename = filename.split('?')[0].split('#')[0]
  
  let result: PhotoStory | null = null
  

  if (PHOTO_STORIES[filename]) {
    result = PHOTO_STORIES[filename]
  } else {

    const extMatch = filename.match(/(\.[^.]+)$/)
    if (extMatch) {
      const ext = extMatch[1]
      const nameWithoutExt = filename.slice(0, -ext.length)
      if (nameWithoutExt.length > 9 && nameWithoutExt[nameWithoutExt.length - 9] === '-') {
        const possibleHash = nameWithoutExt.slice(-8)
        if (/^[A-Za-z0-9_-]{8}$/.test(possibleHash)) {
          const originalName = nameWithoutExt.slice(0, -9) + ext
          if (PHOTO_STORIES[originalName]) {
            result = PHOTO_STORIES[originalName]
          }
        }
      }
    }
  }
  
  storyCache.set(url, result)
  return result
}
