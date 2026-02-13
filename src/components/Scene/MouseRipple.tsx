import { useRef, useMemo, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const rippleVertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uRippleTime;
  uniform float uRippleStrength;
  
  attribute float size;
  attribute vec3 customColor;
  attribute vec3 originalPosition;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = customColor;
    
    vec3 pos = position;
    
    // 计算与鼠标的距离
    float dist = length(pos.xy - uMouse.xy);
    
    // 涟漪效果
    float rippleRadius = uRippleTime * 150.0;
    float rippleWidth = 60.0;
    float ripple = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) 
                 * smoothstep(rippleRadius + rippleWidth, rippleRadius, dist);
    
    // 涟漪推动粒子
    vec2 dir = normalize(pos.xy - uMouse.xy + 0.001);
    pos.xy += dir * ripple * uRippleStrength * 15.0;
    pos.z += ripple * uRippleStrength * 6.0;
    
    // 脉动效果
    float pulse = sin(uTime * 2.0 + length(pos) * 0.02) * 0.5 + 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float viewDist = -mvPosition.z;
    
    // 近大远小 + 脉动
    float scaledSize = size * (300.0 / max(viewDist, 1.0)) * (0.85 + pulse * 0.3);
    
    // 涟漪处粒子更亮
    vAlpha = smoothstep(800.0, 50.0, viewDist) * 0.9 + 0.1;
    vAlpha += ripple * uRippleStrength * 0.5;
    
    gl_PointSize = max(scaledSize, 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const rippleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    float core = smoothstep(0.3, 0.0, dist) * 0.5;
    vec3 color = vColor + core;
    
    gl_FragColor = vec4(color, alpha);
  }
`

// 确定性伪随机数
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999.9) * 99999.9
  return x - Math.floor(x)
}

// 复用 Vector3 避免每帧 GC
const _tempVector = new THREE.Vector3()
const _tempDir = new THREE.Vector3()
const _tempPos = new THREE.Vector3()

export const MouseRipple = memo(function MouseRipple() {
  const pointsRef = useRef<THREE.Points>(null)
  const mouseRef = useRef(new THREE.Vector3(0, 0, 0))
  const rippleTimeRef = useRef(0)
  const rippleStrengthRef = useRef(0)
  const lastMouseMove = useRef(0)
  const { camera } = useThree()
  
  const count = 12000
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uRippleTime: { value: 0 },
    uRippleStrength: { value: 0 }
  }), [])
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const originalPositions = new Float32Array(count * 3)
    
    const baseColor = new THREE.Color('#d0e0ff')
    
    for (let i = 0; i < count; i++) {
      const s = i + 5000
      const r1 = seededRandom(s * 1.1)
      const r2 = seededRandom(s * 2.2)
      const r3 = seededRandom(s * 3.3)
      const r4 = seededRandom(s * 4.4)
      const r5 = seededRandom(s * 5.5)
      
      // 圆柱形隧道分布，覆盖时光机深度 (Z: 200 到 -9000)
      const theta = r1 * Math.PI * 2
      const tunnelRadius = 50 + r2 * 350  // 隧道半径
      const x = Math.cos(theta) * tunnelRadius
      const y = Math.sin(theta) * tunnelRadius * 0.6
      const z = 200 - r3 * 9200  // Z范围: 200 到 -9000
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      
      originalPositions[i * 3] = x
      originalPositions[i * 3 + 1] = y
      originalPositions[i * 3 + 2] = z
      
      sizes[i] = 1.2 + r4 * 2.5
      
      const starColor = baseColor.clone()
      starColor.offsetHSL((r5 - 0.5) * 0.1, 0, (r5 - 0.5) * 0.2)
      colors[i * 3] = starColor.r
      colors[i * 3 + 1] = starColor.g
      colors[i * 3 + 2] = starColor.b
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3))
    
    return geo
  }, [])
  
  // 监听鼠标移动
  useFrame((state) => {
    const time = state.clock.elapsedTime
    uniforms.uTime.value = time
    
    // 获取鼠标在3D空间的位置（复用预分配的 Vector3）
    const mouse = state.pointer
    _tempVector.set(mouse.x, mouse.y, 0.5)
    _tempVector.unproject(camera)
    _tempDir.copy(_tempVector).sub(camera.position).normalize()
    const distance = -camera.position.z / _tempDir.z
    _tempPos.copy(camera.position).add(_tempDir.multiplyScalar(distance))
    
    // 检测鼠标是否移动
    const mouseDelta = mouseRef.current.distanceTo(_tempPos)
    if (mouseDelta > 2) {
      rippleTimeRef.current = 0
      rippleStrengthRef.current = Math.min(mouseDelta * 0.1, 1)
      lastMouseMove.current = time
    }
    
    mouseRef.current.copy(_tempPos)
    uniforms.uMouse.value.copy(_tempPos)
    
    // 更新涟漪动画
    rippleTimeRef.current += 0.016
    uniforms.uRippleTime.value = rippleTimeRef.current
    
    // 涟漪强度衰减
    rippleStrengthRef.current *= 0.98
    uniforms.uRippleStrength.value = rippleStrengthRef.current
  })
  
  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={rippleVertexShader}
        fragmentShader={rippleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})
