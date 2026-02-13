import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const shootingStarVertexShader = `
  attribute float size;
  attribute float alpha;
  attribute float glow;
  
  varying float vAlpha;
  varying float vGlow;
  
  void main() {
    vAlpha = alpha;
    vGlow = glow;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = size * (250.0 / max(dist, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const shootingStarFragmentShader = `
  varying float vAlpha;
  varying float vGlow;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // 柔和发光核心
    float glow = exp(-dist * 3.5);
    float core = smoothstep(0.5, 0.0, dist);
    
    // 颜色：白色核心 + 淡蓝光晕
    vec3 coreColor = vec3(1.0, 1.0, 1.0);
    vec3 glowColor = vec3(0.8, 0.9, 1.0);
    vec3 color = mix(glowColor, coreColor, core);
    
    float alpha = (glow * 0.7 + core * 0.3) * vAlpha * vGlow;
    
    gl_FragColor = vec4(color, alpha);
  }
`

// 流星尾迹着色器 - 更柔和的渐变
const trailVertexShader = `
  attribute float alpha;
  attribute float width;
  varying float vAlpha;
  
  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = width * (100.0 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const trailFragmentShader = `
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    vec3 color = vec3(0.75, 0.88, 1.0);
    gl_FragColor = vec4(color, alpha * 0.7);
  }
`

interface ShootingStar {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  trail: THREE.Vector3[]
  active: boolean
  brightness: number
}

function createShootingStar(): ShootingStar {
  // 从更广的区域随机生成
  const side = Math.random() > 0.5 ? 1 : -1
  const startX = side * (60 + Math.random() * 100)
  const startY = 30 + Math.random() * 70
  const startZ = -30 - Math.random() * 180
  
  // 向对角方向移动
  const speed = 1.5 + Math.random() * 2.5
  const angle = Math.PI * (0.6 + Math.random() * 0.3) * (side > 0 ? 1 : -1)
  
  return {
    position: new THREE.Vector3(startX, startY, startZ),
    velocity: new THREE.Vector3(
      -Math.cos(angle) * speed * side,
      -Math.sin(angle) * speed * 0.8,
      (Math.random() - 0.5) * 0.3
    ),
    life: 0,
    maxLife: 80 + Math.random() * 80,
    size: 4 + Math.random() * 5,
    trail: [],
    active: true,
    brightness: 0.7 + Math.random() * 0.3
  }
}

export const ShootingStars = memo(function ShootingStars() {
  const starsRef = useRef<ShootingStar[]>([])
  const pointsRef = useRef<THREE.Points>(null)
  const trailRef = useRef<THREE.Points>(null)
  const frameCount = useRef(0)
  const nextSpawnTime = useRef(90)
  
  const maxStars = 4
  const trailLength = 25
  
  const { pointGeometry, trailGeometry } = useMemo(() => {
    const pointGeo = new THREE.BufferGeometry()
    pointGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxStars * 3), 3))
    pointGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(maxStars), 1))
    pointGeo.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(maxStars), 1))
    pointGeo.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(maxStars), 1))
    
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxStars * trailLength * 3), 3))
    trailGeo.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(maxStars * trailLength), 1))
    trailGeo.setAttribute('width', new THREE.BufferAttribute(new Float32Array(maxStars * trailLength), 1))
    
    return { pointGeometry: pointGeo, trailGeometry: trailGeo }
  }, [])
  
  useFrame(() => {
    frameCount.current++
    
    // 随机生成新流星
    if (frameCount.current >= nextSpawnTime.current && starsRef.current.length < maxStars) {
      starsRef.current.push(createShootingStar())
      nextSpawnTime.current = frameCount.current + 150 + Math.random() * 350
    }
    
    const positions = pointGeometry.attributes.position.array as Float32Array
    const sizes = pointGeometry.attributes.size.array as Float32Array
    const alphas = pointGeometry.attributes.alpha.array as Float32Array
    const glows = pointGeometry.attributes.glow.array as Float32Array
    
    const trailPositions = trailGeometry.attributes.position.array as Float32Array
    const trailAlphas = trailGeometry.attributes.alpha.array as Float32Array
    const trailWidths = trailGeometry.attributes.width.array as Float32Array
    
    positions.fill(0)
    sizes.fill(0)
    alphas.fill(0)
    glows.fill(0)
    trailPositions.fill(0)
    trailAlphas.fill(0)
    trailWidths.fill(0)
    
    starsRef.current = starsRef.current.filter((star, starIndex) => {
      if (!star.active) return false
      
      star.life++
      star.position.add(star.velocity)
      
      // 轻微的重力效果
      star.velocity.y -= 0.008
      
      star.trail.unshift(star.position.clone())
      if (star.trail.length > trailLength) {
        star.trail.pop()
      }
      
      // 更自然的渐入渐出
      const lifeRatio = star.life / star.maxLife
      let alpha = 1
      if (lifeRatio < 0.08) {
        alpha = lifeRatio / 0.08
      } else if (lifeRatio > 0.6) {
        alpha = 1 - (lifeRatio - 0.6) / 0.4
      }
      alpha *= star.brightness
      
      // 闪烁效果
      const flicker = 0.9 + Math.sin(star.life * 0.5) * 0.1
      
      positions[starIndex * 3] = star.position.x
      positions[starIndex * 3 + 1] = star.position.y
      positions[starIndex * 3 + 2] = star.position.z
      sizes[starIndex] = star.size
      alphas[starIndex] = alpha
      glows[starIndex] = flicker
      
      // 尾迹 - 渐变宽度
      star.trail.forEach((pos, i) => {
        const idx = (starIndex * trailLength + i) * 3
        trailPositions[idx] = pos.x
        trailPositions[idx + 1] = pos.y
        trailPositions[idx + 2] = pos.z
        
        const trailFade = 1 - i / trailLength
        trailAlphas[starIndex * trailLength + i] = alpha * trailFade * trailFade * 0.6
        trailWidths[starIndex * trailLength + i] = star.size * 0.6 * trailFade
      })
      
      if (star.life >= star.maxLife) {
        star.active = false
        return false
      }
      
      return true
    })
    
    pointGeometry.attributes.position.needsUpdate = true
    pointGeometry.attributes.size.needsUpdate = true
    pointGeometry.attributes.alpha.needsUpdate = true
    pointGeometry.attributes.glow.needsUpdate = true
    trailGeometry.attributes.position.needsUpdate = true
    trailGeometry.attributes.alpha.needsUpdate = true
    trailGeometry.attributes.width.needsUpdate = true
  })
  
  return (
    <group>
      {/* 流星尾迹 - 用点代替线，更柔和 */}
      <points ref={trailRef} geometry={trailGeometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={trailVertexShader}
          fragmentShader={trailFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* 流星头部 */}
      <points ref={pointsRef} geometry={pointGeometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={shootingStarVertexShader}
          fragmentShader={shootingStarFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
})
