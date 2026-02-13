import { shuffle } from './index'
import { PHOTO_STORIES } from '../config/photoStories'

const photoModules = import.meta.glob<string>('../photos/*.{png,jpg,jpeg,webp}', { 
  eager: true, 
  query: '?url', 
  import: 'default' 
})

export const ALL_PHOTOS = Object.values(photoModules)

export const STORY_PHOTOS = Object.keys(PHOTO_STORIES)
  .map(filename => {
    const match = Object.entries(photoModules).find(([path]) => path.endsWith(filename))
    return match ? match[1] : ''
  })
  .filter(Boolean)

export const OTHER_PHOTOS = shuffle(ALL_PHOTOS.filter(url => !STORY_PHOTOS.includes(url)))

export { photoModules }
