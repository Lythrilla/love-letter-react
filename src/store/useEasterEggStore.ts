import { create } from 'zustand'
import type { EasterEgg } from '../config/easterEggs'
import { getTriggeredEasterEgg, getMissedEasterEggs, easterEggs } from '../config/easterEggs'

const STORAGE_KEY = 'love-letter-easter-eggs'

interface StoredData {
  visitCount: number
  shownEggs: string[]
  lastVisitDate: string
  lastVisitTime?: number
  dismissedMissed?: string[]
  installDate?: string
}

function loadFromStorage(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch { /* ignore */ }
  return { visitCount: 0, shownEggs: [], lastVisitDate: '', lastVisitTime: undefined, dismissedMissed: [] }
}

function saveToStorage(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

interface EasterEggState {
  visitCount: number
  shownEggs: string[]
  currentEgg: EasterEgg | null
  missedEggs: EasterEgg[]
  showMissedPrompt: boolean
  initialized: boolean
  
  init: () => void
  dismissEgg: () => void
  resetShownEggs: () => void
  triggerEggById: (id: string) => void
  viewMissedEgg: (egg: EasterEgg) => void
  dismissMissedPrompt: () => void
  ignoreMissedEgg: (id: string) => void
}

export const useEasterEggStore = create<EasterEggState>((set, get) => ({
  visitCount: 0,
  shownEggs: [],
  currentEgg: null,
  missedEggs: [],
  showMissedPrompt: false,
  initialized: false,

  init: () => {
    if (get().initialized) return
    
    const stored = loadFromStorage()
    const today = new Date().toDateString()
    const dismissedMissed = stored.dismissedMissed || []
    
    const installDate = stored.installDate || today
    
    let newCount = stored.visitCount
    if (stored.lastVisitDate !== today) {
      newCount = stored.visitCount + 1
    }
    
    let shownEggs = stored.shownEggs
    if (stored.lastVisitDate !== today) {
      shownEggs = shownEggs.filter(id => id.startsWith('visit_'))
    }
    
    const triggeredEgg = getTriggeredEasterEgg(newCount, stored.lastVisitDate || null, shownEggs)
    
    const allMissed = getMissedEasterEggs(shownEggs)
    const missedEggs = allMissed.filter(egg => !dismissedMissed.includes(egg.id))
    
    saveToStorage({
      visitCount: newCount,
      shownEggs,
      lastVisitDate: today,
      lastVisitTime: Date.now(),
      dismissedMissed,
      installDate,
    })
    
    set({
      visitCount: newCount,
      shownEggs,
      currentEgg: triggeredEgg,
      missedEggs,
      showMissedPrompt: !triggeredEgg && missedEggs.length > 0,
      initialized: true,
    })
  },

  dismissEgg: () => {
    const { currentEgg, shownEggs, visitCount, missedEggs } = get()
    if (!currentEgg) return
    
    const newShownEggs = [...shownEggs, currentEgg.id]
    const today = new Date().toDateString()
    const stored = loadFromStorage()
    
    saveToStorage({
      visitCount,
      shownEggs: newShownEggs,
      lastVisitDate: today,
      lastVisitTime: Date.now(),
      dismissedMissed: stored.dismissedMissed || [],
      installDate: stored.installDate,
    })
    
    set({
      shownEggs: newShownEggs,
      currentEgg: null,
      showMissedPrompt: missedEggs.length > 0,
    })
  },

  resetShownEggs: () => {
    const today = new Date().toDateString()
    saveToStorage({
      visitCount: get().visitCount,
      shownEggs: [],
      lastVisitDate: today,
      lastVisitTime: Date.now(),
      dismissedMissed: [],
    })
    set({ shownEggs: [], missedEggs: [], showMissedPrompt: false })
  },

  triggerEggById: (id: string) => {
    const egg = easterEggs.find(e => e.id === id)
    if (egg) {
      set({ currentEgg: egg, showMissedPrompt: false })
    }
  },

  viewMissedEgg: (egg: EasterEgg) => {
    const { missedEggs, shownEggs } = get()
    const stored = loadFromStorage()
    
    const newMissedEggs = missedEggs.filter(e => e.id !== egg.id)
    const newShownEggs = [...shownEggs, egg.id]
    
    saveToStorage({
      ...stored,
      shownEggs: newShownEggs,
    })
    
    set({ 
      currentEgg: egg, 
      showMissedPrompt: false,
      missedEggs: newMissedEggs,
      shownEggs: newShownEggs,
    })
  },

  dismissMissedPrompt: () => {
    set({ showMissedPrompt: false })
  },

  ignoreMissedEgg: (id: string) => {
    const { missedEggs } = get()
    const stored = loadFromStorage()
    const newDismissed = [...(stored.dismissedMissed || []), id]
    const newMissedEggs = missedEggs.filter(e => e.id !== id)
    
    saveToStorage({
      ...stored,
      dismissedMissed: newDismissed,
    })
    
    set({
      missedEggs: newMissedEggs,
      showMissedPrompt: newMissedEggs.length > 0,
    })
  },
}))
