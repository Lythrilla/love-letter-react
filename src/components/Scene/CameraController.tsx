import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '../../store/useAppStore'
import * as THREE from 'three'

// 复用 Vector3 避免每帧创建
const _forward = new THREE.Vector3()

export function CameraController() {
  const { camera } = useThree()
  const phase = useAppStore((s) => s.phase)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  
  const isMemoryMode = useAppStore((s) => s.isMemoryMode)
  const cameraResetTrigger = useAppStore((s) => s.cameraResetTrigger)
  // 使用 ref 追踪 isMemoryMode，避免闭包问题
  const isMemoryModeRef = useRef(isMemoryMode)
  
  const pos = useRef({ x: 0, y: 0, z: 70 })
  const targetPos = useRef({ x: 0, y: 0, z: 70 })
  const rot = useRef({ yaw: 0, pitch: 0 })
  const targetRot = useRef({ yaw: 0, pitch: 0 })
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false, shift: false })
  const frameCount = useRef(0)
  const memoryZ = useRef(100) // 时光机模式下的 Z 轴位置
  const mousePos = useRef({ x: 0, y: 0 })

  // 同步 isMemoryMode 到 ref，并处理进入/退出模式
  useEffect(() => {
    if (isMemoryMode && !isMemoryModeRef.current) {
      // 刚进入 Memory Mode，同步 memoryZ 为当前位置，避免跳变
      memoryZ.current = targetPos.current.z
    } else if (!isMemoryMode && isMemoryModeRef.current) {
      // 退出 Memory Mode，重置相机位置到默认
      targetPos.current = { x: 0, y: 0, z: 70 }
      targetRot.current = { yaw: 0, pitch: 0 }
      memoryZ.current = 70
    }
    isMemoryModeRef.current = isMemoryMode
  }, [isMemoryMode])

  // 监听相机重置信号
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      targetPos.current = { x: 0, y: 0, z: 70 }
      targetRot.current = { yaw: 0, pitch: 0 }
      memoryZ.current = 70
    }
  }, [cameraResetTrigger])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (phase === 'reading' || phase === 'stories') return
      isDragging.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
    
    const handleMouseUp = () => {
      isDragging.current = false
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      // 更新鼠标位置用于视差效果
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      }

      if (isDragging.current && phase !== 'reading' && phase !== 'stories') {
        const deltaX = e.clientX - lastMouse.current.x
        const deltaY = e.clientY - lastMouse.current.y
        // 鼠标拖动旋转视角
        targetRot.current.yaw -= deltaX * 0.003
        targetRot.current.pitch -= deltaY * 0.003
        // 限制俯仰角
        targetRot.current.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRot.current.pitch))
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    
    const handleWheel = (e: WheelEvent) => {
      // reading/stories 阶段禁用滚轮
      if (phase === 'reading' || phase === 'stories') return
      
      // 优先处理时光机模式
      if (isMemoryModeRef.current) {
        // 时光机模式：滚轮控制前后
        const speed = e.deltaY * 0.1
        memoryZ.current += speed
        // 限制在 useFrame 中处理
        return
      }
      // 复用 Vector3
      _forward.set(0, 0, -1).applyAxisAngle(_forward.set(0, 1, 0), rot.current.yaw)
      const speed = -e.deltaY * 0.15
      const yaw = rot.current.yaw
      targetPos.current.x += -Math.sin(yaw) * speed
      targetPos.current.z += -Math.cos(yaw) * speed
      // 限制四周范围
      targetPos.current.x = Math.max(-300, Math.min(300, targetPos.current.x))
      targetPos.current.z = Math.max(-300, Math.min(300, targetPos.current.z))
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = true
      if (key === 'a') keys.current.a = true
      if (key === 's') keys.current.s = true
      if (key === 'd') keys.current.d = true
      if (key === ' ') { keys.current.space = true; e.preventDefault() }
      if (key === 'shift') keys.current.shift = true
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = false
      if (key === 'a') keys.current.a = false
      if (key === 's') keys.current.s = false
      if (key === 'd') keys.current.d = false
      if (key === ' ') keys.current.space = false
      if (key === 'shift') keys.current.shift = false
    }
    
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('wheel', handleWheel, { passive: false }) // 标记为非 passive 以便可能阻止默认行为（如果需要）
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [phase]) // 这里只依赖 phase，isMemoryMode 通过 ref 获取

  useFrame(() => {
    frameCount.current++
    // 非交互状态下降低更新频率
    const isInteractive = isDragging.current || keys.current.w || keys.current.a || keys.current.s || keys.current.d || keys.current.space || keys.current.shift
    if (!isInteractive && !isMemoryMode && frameCount.current % 2 !== 0) return
    
    const cam = camera as THREE.PerspectiveCamera

    if (phase === 'reading') {
      targetPos.current = { x: -45, y: 0, z: 55 }
      targetRot.current = { yaw: 0, pitch: 0 }
    } else if (phase === 'stories') {
      targetPos.current.x *= 0.95
      targetPos.current.y *= 0.95
      targetPos.current.z += (60 - targetPos.current.z) * 0.03
      targetRot.current.yaw *= 0.95
      targetRot.current.pitch *= 0.95
    } else if (isMemoryMode) {
      
      memoryZ.current = Math.max(-8500, Math.min(150, memoryZ.current))
      
      const parallaxX = mousePos.current.x * 20
      const parallaxY = mousePos.current.y * 20
      
      targetPos.current.x = parallaxX
      targetPos.current.y = parallaxY
      targetPos.current.z = memoryZ.current
      
      targetRot.current.yaw = 0
      targetRot.current.pitch = 0
      
      const lerpSpeed = 0.05
      pos.current.x += (targetPos.current.x - pos.current.x) * lerpSpeed
      pos.current.y += (targetPos.current.y - pos.current.y) * lerpSpeed
      pos.current.z += (targetPos.current.z - pos.current.z) * lerpSpeed
      
      cam.position.set(pos.current.x, pos.current.y, pos.current.z)
      cam.lookAt(0, 0, pos.current.z - 100)
      return
    } else {
      const moveSpeed = 0.4
      const yaw = rot.current.yaw
      
      const forwardX = -Math.sin(yaw)
      const forwardZ = -Math.cos(yaw)
      const rightX = Math.cos(yaw)
      const rightZ = -Math.sin(yaw)
      
      if (keys.current.w) {
        targetPos.current.x += forwardX * moveSpeed
        targetPos.current.z += forwardZ * moveSpeed
      }
      if (keys.current.s) {
        targetPos.current.x -= forwardX * moveSpeed
        targetPos.current.z -= forwardZ * moveSpeed
      }
      if (keys.current.a) {
        targetPos.current.x -= rightX * moveSpeed
        targetPos.current.z -= rightZ * moveSpeed
      }
      if (keys.current.d) {
        targetPos.current.x += rightX * moveSpeed
        targetPos.current.z += rightZ * moveSpeed
      }
      if (keys.current.space) targetPos.current.y += moveSpeed
      if (keys.current.shift) targetPos.current.y -= moveSpeed
      
      targetPos.current.x = Math.max(-300, Math.min(300, targetPos.current.x))
      targetPos.current.y = Math.max(-300, Math.min(300, targetPos.current.y))
      targetPos.current.z = Math.max(-300, Math.min(300, targetPos.current.z))
    }
    
    const lerpSpeed = 0.08
    pos.current.x += (targetPos.current.x - pos.current.x) * lerpSpeed
    pos.current.y += (targetPos.current.y - pos.current.y) * lerpSpeed
    pos.current.z += (targetPos.current.z - pos.current.z) * lerpSpeed
    rot.current.yaw += (targetRot.current.yaw - rot.current.yaw) * lerpSpeed
    rot.current.pitch += (targetRot.current.pitch - rot.current.pitch) * lerpSpeed
    
    // 应用位置
    cam.position.set(pos.current.x, pos.current.y, pos.current.z)
    
    // 计算看向的点（基于旋转）
    const lookDist = 100
    const cosPitch = Math.cos(rot.current.pitch)
    const sinPitch = Math.sin(rot.current.pitch)
    const lookX = pos.current.x - Math.sin(rot.current.yaw) * cosPitch * lookDist
    const lookY = pos.current.y + sinPitch * lookDist
    const lookZ = pos.current.z - Math.cos(rot.current.yaw) * cosPitch * lookDist
    cam.lookAt(lookX, lookY, lookZ)
  })

  return null
}
