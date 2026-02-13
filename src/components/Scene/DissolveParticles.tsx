import { useRef, useMemo, memo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobile } from '../../utils'

interface DissolveParticlesProps {
  active: boolean
  photoPositions: Array<{ x: number; y: number; z: number }>
}

// 照片消散粒子效果
export const DissolveParticles = memo(function DissolveParticles({ active, photoPositions }: DissolveParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const startTimeRef = useRef<number | null>(null)
  const velocitiesRef = useRef<Float32Array | null>(null)
  
  // 固定粒子数
  const maxParticles = isMobile ? 1000 : 2000
  
  const positions = useMemo(() => new Float32Array(maxParticles * 3), [maxParticles])
  
  // 当active变化时重置
  useEffect(() => {
    if (!active) {
      startTimeRef.current = null
      velocitiesRef.current = null
    }
  }, [active])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    // 初始化粒子
    if (active && !startTimeRef.current && photoPositions.length > 0) {
      startTimeRef.current = state.clock.elapsedTime
      
      const velocities = new Float32Array(maxParticles * 3)
      const particlesPerPhoto = Math.floor(maxParticles / Math.max(1, photoPositions.length))
      
      let idx = 0
      for (let p = 0; p < photoPositions.length && idx < maxParticles; p++) {
        const photo = photoPositions[p]
        if (!photo || photo.x === 0 && photo.y === 0 && photo.z === 0) continue
        
        for (let i = 0; i < particlesPerPhoto && idx < maxParticles; i++) {
          // 粒子在照片范围内生成
          positions[idx * 3] = photo.x + (Math.random() - 0.5) * 10
          positions[idx * 3 + 1] = photo.y + (Math.random() - 0.5) * 8
          positions[idx * 3 + 2] = photo.z + (Math.random() - 0.5) * 2
          
          // 向外扩散 + 轻微上升
          const angle = Math.random() * Math.PI * 2
          const speed = 0.08 + Math.random() * 0.12
          velocities[idx * 3] = Math.cos(angle) * speed
          velocities[idx * 3 + 1] = Math.sin(angle) * speed * 0.5 + 0.03
          velocities[idx * 3 + 2] = (Math.random() - 0.5) * speed * 0.5
          
          idx++
        }
      }
      
      velocitiesRef.current = velocities
      
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      posAttr.needsUpdate = true
    }
    
    if (!active || !startTimeRef.current || !velocitiesRef.current) return
    
    const elapsed = state.clock.elapsedTime - startTimeRef.current
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const velocities = velocitiesRef.current
    
    // 更新粒子位置
    for (let i = 0, j = 0; i < maxParticles; i++, j += 3) {
      posArray[j] += velocities[j]
      posArray[j + 1] += velocities[j + 1]
      posArray[j + 2] += velocities[j + 2]
      
      // 速度衰减
      velocities[j] *= 0.97
      velocities[j + 1] *= 0.97
      velocities[j + 2] *= 0.97
    }
    
    posAttr.needsUpdate = true
    
    // 淡出
    const material = pointsRef.current.material as THREE.PointsMaterial
    material.opacity = Math.max(0, 1 - elapsed * 0.2)
  })

  if (!active) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.5 : 0.7}
        color="#ffb8d0"
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})
