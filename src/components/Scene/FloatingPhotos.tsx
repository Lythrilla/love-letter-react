import { useRef, useState, useEffect, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { getPhotoStory } from '../../config/photoStories'
import { PhotoStoryOverlay } from './PhotoStoryOverlay'
import { DissolveParticles } from './DissolveParticles'
import { seededRandom } from '../../utils'
import { ALL_PHOTOS, STORY_PHOTOS, OTHER_PHOTOS } from '../../utils/photos'
import { CHAT_TRIGGER_PHOTO, isPhotoMatch } from '../../config/chatTrigger'

// 生成漂浮位置 - 增大前后间距
function generateFloatPosition(index: number, total: number) {
  const seed = index * 12345
  const angle = (index / total) * Math.PI * 2
  const radius = 40 + seededRandom(seed) * 50
  
  return {
    x: Math.cos(angle) * radius + (seededRandom(seed + 1) - 0.5) * 40,
    y: (seededRandom(seed + 2) - 0.5) * 50,
    z: -80 + seededRandom(seed + 3) * 160,  // Z轴范围 -80 到 +80
    rotX: (seededRandom(seed + 4) - 0.5) * 0.15,
    rotY: (seededRandom(seed + 5) - 0.5) * 0.15,
    rotZ: (seededRandom(seed + 6) - 0.5) * 0.1,
    scale: 0.5 + seededRandom(seed + 7) * 0.6,
    floatSpeed: 0.15 + seededRandom(seed + 8) * 0.25,
    floatOffset: seededRandom(seed + 9) * Math.PI * 2,
  }
}


// 纹理缓存
const textureCache = new Map<string, { texture: THREE.Texture, width: number, height: number }>()
const loader = new THREE.TextureLoader()

// 延迟预加载标志
let preloadStarted = false

// 启动预加载（只在需要时调用）
export function startTexturePreload() {
  if (preloadStarted) return
  preloadStarted = true
  
  ALL_PHOTOS.forEach((url, i) => {
    setTimeout(() => {
      if (textureCache.has(url)) return
      loader.load(url, (tex) => {
        const img = tex.image
        const maxSize = 12
        const aspect = img.width / img.height
        const width = aspect > 1 ? maxSize : maxSize * aspect
        const height = aspect > 1 ? maxSize / aspect : maxSize
        textureCache.set(url, { texture: tex, width, height })
      })
    }, i * 50)
  })
}

// ==================== 普通照片组件（星河漂浮用）====================
interface FloatingPhotoProps {
  url: string
  index: number
  totalCount: number
  phase: string
  spawnTime: number
  isSelected: boolean
  isAnySelected: boolean
  onSelect: () => void
  isFading: boolean
  isMemoryMode: boolean
  positionsRef: React.MutableRefObject<Array<{ x: number; y: number; z: number }>>
}

// 复用 Vector3 避免每帧 GC
const _tempVec3 = new THREE.Vector3()
const _tempColor = [1.18, 1.1, 0.95] as const

const FloatingPhoto = memo(function FloatingPhoto({ url, index, totalCount, phase, spawnTime, isSelected, isAnySelected, onSelect, isFading, isMemoryMode, positionsRef }: FloatingPhotoProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState(false)
  const sizeRef = useRef({ width: 8, height: 8 })
  const textureRef = useRef<THREE.Texture | null>(null)
  
  const currentPos = useRef({ x: 0, y: 0, z: -100 })
  const opacityRef = useRef(0)
  const scaleRef = useRef(0)
  const lastLookAt = useRef({ x: 0, y: 0, z: 0 })

  const floatPos = useMemo(() => generateFloatPosition(index, totalCount), [index, totalCount])
  
  // 计算螺旋位置 (Memory Mode)
  const spiralPos = useMemo(() => {
    // 螺旋参数
    const spacing = 30 // 间距
    const radius = 25 // 螺旋半径
    const anglePerStep = 0.8 // 每张照片的角度增量
    
    const angle = index * anglePerStep
    // 照片从 Z=70 开始往前（负方向）排列
    const z = 70 - index * spacing
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    
    return { x, y, z, rotZ: angle }
  }, [index, totalCount])

  const story = useMemo(() => getPhotoStory(url), [url])

  useEffect(() => {
    let cancelled = false
    const checkCache = () => {
      if (cancelled) return
      const cached = textureCache.get(url)
      if (cached) {
        textureRef.current = cached.texture
        sizeRef.current = { width: cached.width, height: cached.height }
        setReady(true)
      } else {
        setTimeout(checkCache, 100)
      }
    }
    checkCache()
    return () => { cancelled = true }
  }, [url])

  const frameCount = useRef(0)
  
  useFrame((state) => {
    if (!groupRef.current || !meshRef.current || !ready) return
    
    frameCount.current++
    
    // 非选中照片每2帧更新一次，减少计算量
    if (!isSelected && frameCount.current % 2 !== 0) return
    
    const t = state.clock.elapsedTime
    const angle = (index / totalCount) * Math.PI * 2

    let targetX: number, targetY: number, targetZ: number
    let targetScale = floatPos.scale
    let targetOpacity = 1

    if (phase === 'stories') {
      targetX = floatPos.x * 2
      targetY = floatPos.y * 2
      targetZ = -80
      targetOpacity = 1
      targetScale = 0.3
    } else if (phase === 'reading') {
      // reading 阶段：圆环效果（时光机模式下也一样）
      const radius = 40
      const rot = angle + t * 0.02
      targetX = Math.cos(rot) * radius - 70
      targetY = Math.sin(index * 0.6 + t * 0.015) * 18
      targetZ = Math.sin(rot) * radius - 10
      targetScale = 0.85
    } else if (isMemoryMode) {
      // 时光隧道模式
      targetX = spiralPos.x
      targetY = spiralPos.y
      targetZ = spiralPos.z
      targetOpacity = 1
      targetScale = 0.8
    } else {
      const orbitX = Math.cos(t * floatPos.floatSpeed + floatPos.floatOffset) * 3
      const orbitY = Math.sin(t * floatPos.floatSpeed * 0.8 + floatPos.floatOffset) * 2
      targetX = floatPos.x + orbitX
      targetY = floatPos.y + orbitY
      targetZ = floatPos.z
    }

    if (isFading) {
      targetOpacity = 0
      targetScale = 0
    } else if (isSelected) {
      if (phase === 'reading') {
        // reading 阶段：选中的照片固定在相机视野左侧
        // 相机位置: x=-45, y=0, z=55，看向 -Z 方向
        targetX = -50  // 相机左侧
        targetY = 0
        targetZ = 30   // 在相机前方
        targetScale = 1.5
        targetOpacity = 1
      } else {
        // 其他阶段：移动到相机正前方居中
        const cam = state.camera
        const dist = 25  // 稍微拉近一点
        _tempVec3.set(0, 0, -1).applyQuaternion(cam.quaternion)
        targetX = cam.position.x + _tempVec3.x * dist
        targetY = cam.position.y + _tempVec3.y * dist
        targetZ = cam.position.z + _tempVec3.z * dist
        // 根据照片尺寸计算合适的缩放，确保照片大小适中
        const maxDim = Math.max(sizeRef.current.width, sizeRef.current.height)
        targetScale = 18 / maxDim
        targetOpacity = 1
      }
    } else if (hovered) {
      targetScale = floatPos.scale * 1.6
      targetOpacity = 1
    }
    
    if (isAnySelected && !isSelected) {
      targetOpacity = 0.1
    }

    const appearProgress = Math.min((t - spawnTime) / 2, 1)
    const easeProgress = 1 - Math.pow(1 - appearProgress, 3)

    // 平滑插值
    const lerpSpeed = isSelected ? 0.06 : 0.05
    currentPos.current.x += (targetX - currentPos.current.x) * lerpSpeed
    currentPos.current.y += (targetY - currentPos.current.y) * lerpSpeed
    currentPos.current.z += (targetZ - currentPos.current.z) * lerpSpeed

    groupRef.current.position.set(currentPos.current.x, currentPos.current.y, currentPos.current.z)
    
    // 更新位置到共享ref供粒子效果使用
    positionsRef.current[index] = { x: currentPos.current.x, y: currentPos.current.y, z: currentPos.current.z }
    
    // 仅当相机位置变化足够大时才更新 lookAt
    const camPos = state.camera.position
    if (phase === 'reading') {
      // reading 模式：照片正对前方，只在 XZ 平面上朝向相机
      groupRef.current.rotation.set(0, 0, 0)
      groupRef.current.lookAt(camPos.x, currentPos.current.y, camPos.z)
    } else {
      const dx = camPos.x - lastLookAt.current.x
      const dy = camPos.y - lastLookAt.current.y
      const dz = camPos.z - lastLookAt.current.z
      if (dx * dx + dy * dy + dz * dz > 1) {
        groupRef.current.lookAt(camPos)
        lastLookAt.current = { x: camPos.x, y: camPos.y, z: camPos.z }
      }
    }
    
    if (isFading) {
      // 瞬间消失
      scaleRef.current = 0
      opacityRef.current = 0
    } else {
      // 平滑过渡
      const scaleLerp = hovered ? 0.08 : 0.04
      scaleRef.current += (targetScale * easeProgress - scaleRef.current) * scaleLerp
      opacityRef.current += (targetOpacity * easeProgress - opacityRef.current) * 0.05
    }
    
    groupRef.current.scale.setScalar(Math.max(0.01, scaleRef.current))

    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    if (mat) mat.opacity = opacityRef.current

    // 动态更新 renderOrder：基于 Z 深度，越近相机越后渲染（显示在前面）
    if (!isSelected && !hovered) {
      const distToCamera = state.camera.position.distanceTo(groupRef.current.position)
      meshRef.current.renderOrder = Math.floor(1000 - distToCamera)
    }
  })

  if (!ready || !textureRef.current) return null

  const { width, height } = sizeRef.current

  return (
    <group 
      ref={groupRef} 
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={meshRef} renderOrder={isSelected ? 1000 : (hovered ? 999 : index + 100)}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={textureRef.current} side={THREE.DoubleSide} transparent opacity={0} depthWrite={false} toneMapped={false} color={_tempColor} />
      </mesh>
      {isSelected && story && (
        <PhotoStoryOverlay story={story} onClose={onSelect} />
      )}
    </group>
  )
})

// ==================== 主组件 ====================
export function FloatingPhotos() {
  const phase = useAppStore((s) => s.phase)
  const showPhotos = useAppStore((s) => s.showPhotos)
  const setPhotosLoaded = useAppStore((s) => s.setPhotosLoaded)
  const photosFading = useAppStore((s) => s.photosFading)
  const isMemoryMode = useAppStore((s) => s.isMemoryMode)
  const setShowChat = useAppStore((s) => s.setShowChat)
  
  const [visibleCount, setVisibleCount] = useState(0)
  const [fadingCount, setFadingCount] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [photoPositions, setPhotoPositions] = useState<Array<{ x: number; y: number; z: number }>>([])
  const spawnTimesRef = useRef<number[]>([])
  const livePositionsRef = useRef<Array<{ x: number; y: number; z: number }>>([])
  const clockRef = useRef(0)

  // 预计算排序后的照片（按日期）
  const sortedPhotos = useMemo(() => {
    return [...STORY_PHOTOS, ...OTHER_PHOTOS].sort((a, b) => {
      const storyA = getPhotoStory(a)
      const storyB = getPhotoStory(b)
      if (!storyA?.date) return 1
      if (!storyB?.date) return -1
      return new Date(storyA.date).getTime() - new Date(storyB.date).getTime()
    })
  }, [])
  
  // 预计算默认（随机）照片列表
  const defaultPhotos = useMemo(() => [...STORY_PHOTOS, ...OTHER_PHOTOS], [])

  // 使用排序后的列表或随机列表
  const displayPhotos = isMemoryMode ? sortedPhotos : defaultPhotos
  const photoCount = displayPhotos.length
  
  // ESC 键退出选中
  useEffect(() => {
    if (selectedIndex === null) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex])
  
  // 点击空白处退出
  const handleMissed = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(null)
    }
  }
  
  const allPhotos = displayPhotos
  
  useFrame((state) => {
    clockRef.current = state.clock.elapsedTime
  })

  // 照片消散效果
  useEffect(() => {
    if (!photosFading) {
      setFadingCount(0)
      setPhotoPositions([])
      return
    }
    
    // 使用照片的实际位置用于粒子效果
    setPhotoPositions([...livePositionsRef.current.slice(0, visibleCount)])
    
    let removeInterval: ReturnType<typeof setInterval> | null = null
    
    // 开始快速移除
    removeInterval = setInterval(() => {
      setFadingCount(c => {
        if (c >= visibleCount) {
          if (removeInterval) clearInterval(removeInterval)
          return c
        }
        return c + 1
      })
    }, 30) // 每30ms消失一张
    
    return () => {
      if (removeInterval) clearInterval(removeInterval)
    }
  }, [photosFading, visibleCount, photoCount])

  // 照片逐个出现
  useEffect(() => {
    // 重置状态当 phase 变化或 showPhotos 变化
    if (!showPhotos) {
      setVisibleCount(0)
      spawnTimesRef.current = []
      livePositionsRef.current = []
      return
    }
    
    // stories 阶段不显示照片
    if (phase === 'stories') {
      return
    }
    
    if (visibleCount < photoCount) {
      const timer = setTimeout(() => {
        spawnTimesRef.current.push(clockRef.current)
        setVisibleCount(c => c + 1)
      }, 60)
      return () => clearTimeout(timer)
    } else if (visibleCount >= photoCount) {
      // 即使没有照片（photoCount === 0）也要设置为已加载
      const timer = setTimeout(() => setPhotosLoaded(true), photoCount > 0 ? 1000 : 100)
      return () => clearTimeout(timer)
    }
  }, [showPhotos, visibleCount, photoCount, setPhotosLoaded, phase])

  const handleSelect = (index: number) => {
    if (phase === 'ready' || phase === 'reading') {
      const url = displayPhotos[index]
      // 检查是否是触发聊天的照片
      if (isPhotoMatch(url, CHAT_TRIGGER_PHOTO)) {
        setShowChat(true)
        return
      }
      setSelectedIndex(prev => prev === index ? null : index)
    }
  }

  if (!showPhotos) return null

  const displayCount = photosFading ? Math.max(0, visibleCount - fadingCount) : visibleCount

  return (
    <group onPointerMissed={handleMissed}>
      {/* ready/reading/ending 阶段：显示照片 */}
      {(phase === 'ready' || phase === 'reading' || phase === 'ending') && allPhotos.slice(0, displayCount).map((url, i) => (
        <FloatingPhoto
          key={url}
          url={url}
          index={i}
          totalCount={photoCount}
          phase={phase}
          spawnTime={spawnTimesRef.current[i] ?? clockRef.current}
          isSelected={selectedIndex === i}
          isAnySelected={selectedIndex !== null}
          onSelect={() => handleSelect(i)}
          isFading={photosFading}
          isMemoryMode={isMemoryMode}
          positionsRef={livePositionsRef}
        />
      ))}
      
      {/* 粒子消散效果 */}
      <DissolveParticles active={photosFading} photoPositions={photoPositions} />
    </group>
  )
}
