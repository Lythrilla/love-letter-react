import { create } from 'zustand'

type Phase = 'start' | 'intro' | 'stories' | 'ready' | 'reading' | 'ending'

interface AppState {
  phase: Phase
  introStep: number
  showPhotos: boolean
  photosLoaded: boolean
  currentTime: number
  isPlaying: boolean
  musicStarted: boolean
  currentStoryIndex: number
  storiesComplete: boolean
  photosFading: boolean
  previewPhoto: string | null
  isMemoryMode: boolean
  cameraResetTrigger: number
  bgmFadeOut: boolean
  hideLyrics: boolean
  showChat: boolean
  showNovel: boolean
  setPhase: (phase: Phase) => void
  nextIntroStep: () => void
  setShowPhotos: (show: boolean) => void
  setPhotosLoaded: (loaded: boolean) => void
  setMusicState: (time: number, playing: boolean) => void
  setMusicStarted: (started: boolean) => void
  setCurrentStoryIndex: (index: number) => void
  setStoriesComplete: (complete: boolean) => void
  setPhotosFading: (fading: boolean) => void
  setPreviewPhoto: (url: string | null) => void
  setMemoryMode: (mode: boolean) => void
  resetCamera: () => void
  setBgmFadeOut: (fadeOut: boolean) => void
  setHideLyrics: (hide: boolean) => void
  setShowChat: (show: boolean) => void
  setShowNovel: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'start',
  introStep: 0,
  showPhotos: false,
  photosLoaded: false,
  currentTime: 0,
  isPlaying: false,
  musicStarted: false,
  currentStoryIndex: 0,
  storiesComplete: false,
  photosFading: false,
  previewPhoto: null,
  isMemoryMode: false,
  cameraResetTrigger: 0,
  bgmFadeOut: false,
  hideLyrics: false,
  showChat: false,
  showNovel: false,
  setPhase: (phase) => set({ phase }),
  nextIntroStep: () => set((state) => ({ introStep: state.introStep + 1 })),
  setShowPhotos: (show) => set({ showPhotos: show }),
  setPhotosLoaded: (loaded) => set({ photosLoaded: loaded }),
  setMusicState: (time, playing) => set({ currentTime: time, isPlaying: playing }),
  setMusicStarted: (started) => set({ musicStarted: started }),
  setCurrentStoryIndex: (index) => set({ currentStoryIndex: index }),
  setStoriesComplete: (complete) => set({ storiesComplete: complete }),
  setPhotosFading: (fading) => set({ photosFading: fading }),
  setPreviewPhoto: (url) => set({ previewPhoto: url }),
  setMemoryMode: (mode) => set({ isMemoryMode: mode }),
  resetCamera: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
  setBgmFadeOut: (fadeOut) => set({ bgmFadeOut: fadeOut }),
  setHideLyrics: (hide) => set({ hideLyrics: hide }),
  setShowChat: (show) => set({ showChat: show }),
  setShowNovel: (show) => set({ showNovel: show }),
}))

