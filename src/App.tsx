import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Scene } from './components/Scene'
import { UI } from './components/UI'
import { LetterPanel } from './components/Letter'
import { MusicPlayer } from './components/UI/MusicPlayer'
import { Lyrics } from './components/UI/Lyrics'
import { StoryGallery } from './components/UI/StoryGallery'
import { BackToStories } from './components/UI/BackToStories'
import { StartScreen } from './components/UI/StartScreen'
import { EndingScreen } from './components/UI/EndingScreen'
import { PasswordScreen } from './components/UI/PasswordScreen'
import { TitleBar } from './components/UI/TitleBar'
import { useAppStore } from './store/useAppStore'

const ChatPage = lazy(() => import('./components/Chat/ChatPage'))
const ChatModal = lazy(() => import('./components/Chat/ChatModal').then(m => ({ default: m.ChatModal })))
const EasterEggModal = lazy(() => import('./components/UI/EasterEggModal').then(m => ({ default: m.EasterEggModal })))
const EasterEggDebug = lazy(() => import('./components/UI/EasterEggDebug').then(m => ({ default: m.EasterEggDebug })))
const MissedEggPrompt = lazy(() => import('./components/UI/MissedEggPrompt').then(m => ({ default: m.MissedEggPrompt })))
const NovelReader = lazy(() => import('./components/UI/NovelReader').then(m => ({ default: m.NovelReader })))

function NovelReaderWrapper() {
  const showNovel = useAppStore(s => s.showNovel)
  const setShowNovel = useAppStore(s => s.setShowNovel)
  return <NovelReader visible={showNovel} onClose={() => setShowNovel(false)} />
}

function App() {
  const [route, setRoute] = useState(window.location.hash)
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem('unlocked') === 'true'
  })

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  
  const handleUnlock = useCallback(() => {
    localStorage.setItem('unlocked', 'true')
    setUnlocked(true)
  }, [])
  
  if (route.startsWith('#/chat')) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
        <ChatPage />
      </Suspense>
    )
  }

  if (!unlocked) {
    return (
      <>
        <TitleBar />
        <PasswordScreen onSuccess={handleUnlock} />
      </>
    )
  }
  
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <TitleBar />
      <Scene />
      <UI />
      <LetterPanel />
      <MusicPlayer />
      <Lyrics />
      <StoryGallery />
      <BackToStories />
      <StartScreen />
      <EndingScreen />
      <Suspense fallback={null}>
        <ChatModal />
        <EasterEggModal />
        <EasterEggDebug />
        <MissedEggPrompt />
        <NovelReaderWrapper />
      </Suspense>
      <div className="global-copyright">Made with Love ♥ by 浩浩</div>
    </main>
  )
}

export default App
