import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { FloatingPhotos } from './FloatingPhotos'
import { CameraController } from './CameraController'
import { ToBeContinuedTracker } from '../UI/ToBeContinued'
import { ShootingStars } from './ShootingStars'
import { MouseRipple } from './MouseRipple'
import { useRef, memo, useMemo } from 'react'
import * as THREE from 'three'
import { isMobile } from '../../utils'
const cameraFov = isMobile ? 70 : 50
const cameraZ = isMobile ? 100 : 70

// 星云着色器 - 多层次梦幻效果
const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uIntensity;
  varying vec2 vUv;
 
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
 
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
 
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.6;
    mat2 m = mat2(1.2, 0.8, -0.8, 1.2);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = m * p + vec2(0.3, 0.7);
      a *= 0.45;
    }
    return v;
  }
 
  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
 
    float t = uTime * 0.02;
    vec2 p = uv * 2.5;
    
    // 多层噪声叠加
    float n1 = fbm(p + vec2(t, -t * 0.7));
    float n2 = fbm(p * 1.5 - vec2(t * 0.8, t * 0.5));
    float n3 = fbm2(p * 0.8 + vec2(-t * 0.3, t * 0.4));
    float n = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;
    
    // 涡旋效果
    float angle = atan(uv.y, uv.x);
    float spiral = sin(angle * 3.0 + dist * 8.0 - t * 2.0) * 0.5 + 0.5;
    n = mix(n, n * spiral, 0.15);
 
    // 柔和的核心衰减
    float core = smoothstep(0.7, 0.0, dist);
    float alpha = core * (0.06 + n * 0.2) * uIntensity;
    alpha *= smoothstep(0.0, 0.4, n);
    
    // 边缘柔化
    alpha *= smoothstep(0.55, 0.35, dist);
 
    // 三色渐变
    float hue = clamp(n * 1.3 + dist * 0.3, 0.0, 1.0);
    vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, hue));
    color = mix(color, uColor3, smoothstep(0.5, 1.0, hue));
    
    // 微弱的色彩脉动
    color += vec3(0.02, 0.01, 0.03) * sin(t * 3.0 + dist * 5.0);
    
    gl_FragColor = vec4(color, alpha);
  }
 `

// 星云组件 - 支持三色渐变
const Nebula = memo(function Nebula({ position, color1, color2, color3, scale = 1, intensity = 1 }: { 
  position: [number, number, number]
  color1: string
  color2: string
  color3?: string
  scale?: number
  intensity?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uColor3: { value: new THREE.Color(color3 || color2) },
    uIntensity: { value: intensity },
  }), [color1, color2, color3, intensity])
  
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uTime.value = state.clock.elapsedTime

      meshRef.current.position.set(
        camera.position.x + position[0],
        camera.position.y + position[1],
        camera.position.z + position[2]
      )
      meshRef.current.quaternion.copy(camera.quaternion)
    }
  })
  
  return (
    <mesh ref={meshRef} scale={scale} frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[360, 360]} />
      <shaderMaterial
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
})

// 自定义3D星星顶点着色器 - 实现近大远小 + 闪烁效果
const starsVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float twinkleSpeed;
  attribute float twinklePhase;
  
  uniform float uTime;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vTwinkle;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // 根据距离计算大小 - 近大远小
    float dist = -mvPosition.z;
    float scaledSize = size * (300.0 / max(dist, 1.0));
    
    // 根据距离计算透明度 - 远处更暗
    vAlpha = smoothstep(800.0, 50.0, dist) * 0.9 + 0.1;
    
    // 闪烁效果
    float twinkle = sin(uTime * twinkleSpeed + twinklePhase) * 0.5 + 0.5;
    twinkle = twinkle * 0.4 + 0.6; // 限制闪烁范围 0.6-1.0
    vTwinkle = twinkle;
    
    gl_PointSize = max(scaledSize * twinkle, 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starsFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vTwinkle;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // 柔和的圆形星星 + 光晕
    float alpha = smoothstep(0.5, 0.15, dist) * vAlpha * vTwinkle;
    
    // 核心更亮 + 十字光芒
    float core = smoothstep(0.25, 0.0, dist) * 0.6;
    
    // 微弱的十字光芒
    float cross = max(
      smoothstep(0.08, 0.0, abs(center.x)) * smoothstep(0.4, 0.0, abs(center.y)),
      smoothstep(0.08, 0.0, abs(center.y)) * smoothstep(0.4, 0.0, abs(center.x))
    ) * 0.3;
    
    vec3 color = vColor + core + cross;
    
    gl_FragColor = vec4(color, alpha + cross * 0.5);
  }
`

// 确定性伪随机数生成器
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999.9) * 99999.9
  return x - Math.floor(x)
}

// 预生成星星数据（组件外部，只执行一次）
function generateStarsData(
  count: number,
  spread: number,
  depthRange: [number, number],
  minSize: number,
  maxSize: number,
  color: string,
  saturation: number,
  seed: number
) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const twinkleSpeeds = new Float32Array(count)
  const twinklePhases = new Float32Array(count)
  
  const baseColor = new THREE.Color(color)
  
  // 星星颜色变体 - 更丰富的色彩
  const colorVariants = [
    new THREE.Color('#ffffff'), // 白色
    new THREE.Color('#ffe4c4'), // 暖黄
    new THREE.Color('#b0c4ff'), // 冷蓝
    new THREE.Color('#ffd0e0'), // 粉红
    new THREE.Color('#c0ffee'), // 青绿
  ]
  
  for (let i = 0; i < count; i++) {
    const s = seed + i
    const r1 = seededRandom(s * 1.1)
    const r2 = seededRandom(s * 2.2)
    const r3 = seededRandom(s * 3.3)
    const r4 = seededRandom(s * 4.4)
    const r5 = seededRandom(s * 5.5)
    const r6 = seededRandom(s * 6.6)
    const r7 = seededRandom(s * 7.7)
    const r8 = seededRandom(s * 8.8)
    const r9 = seededRandom(s * 9.9)
    
    const theta = r1 * Math.PI * 2
    const phi = Math.acos(2 * r2 - 1)
    const r = spread * (0.3 + r3 * 0.7)
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
    positions[i * 3 + 2] = depthRange[0] + r4 * (depthRange[1] - depthRange[0])
    
    sizes[i] = minSize + r5 * (maxSize - minSize)
    
    // 闪烁参数
    twinkleSpeeds[i] = 0.5 + r8 * 2.5 // 0.5-3.0 的闪烁速度
    twinklePhases[i] = r9 * Math.PI * 2 // 随机相位
    
    // 颜色混合 - 基础色 + 随机变体
    const variantIndex = Math.floor(r6 * colorVariants.length)
    const variant = colorVariants[variantIndex]
    const starColor = baseColor.clone().lerp(variant, saturation * r7)
    starColor.offsetHSL(0, 0, (r7 - 0.5) * 0.15)
    
    colors[i * 3] = starColor.r
    colors[i * 3 + 1] = starColor.g
    colors[i * 3 + 2] = starColor.b
  }
  
  return { positions, sizes, colors, twinkleSpeeds, twinklePhases }
}

// 3D立体星空 - 真正的空间分布 + 闪烁效果
const DeepSpaceStars = memo(function DeepSpaceStars({ 
  count, 
  spread, 
  depthRange,
  minSize,
  maxSize,
  color,
  saturation = 0,
  seed = 1
}: {
  count: number
  spread: number
  depthRange: [number, number]
  minSize: number
  maxSize: number
  color: string
  saturation?: number
  seed?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const { positions, sizes, colors, twinkleSpeeds, twinklePhases } = useMemo(() => {
    return generateStarsData(count, spread, depthRange, minSize, maxSize, color, saturation, seed)
  }, [count, spread, depthRange, minSize, maxSize, color, saturation, seed])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1))
    geo.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1))
    return geo
  }, [positions, sizes, colors, twinkleSpeeds, twinklePhases])
  
  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <points ref={pointsRef} frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        vertexShader={starsVertexShader}
        fragmentShader={starsFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

// 星尘带着色器 - 银河系般的星尘效果
const starDustVertexShader = `
  attribute float size;
  attribute float alpha;
  attribute vec3 customColor;
  
  uniform float uTime;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    vAlpha = alpha;
    
    vec3 pos = position;
    // 微弱的波动
    pos.y += sin(pos.x * 0.02 + uTime * 0.3) * 2.0;
    pos.x += cos(pos.z * 0.015 + uTime * 0.2) * 1.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = size * (150.0 / max(dist, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starDustFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`

// 星尘带组件 - 银河系效果
const StarDustBand = memo(function StarDustBand() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const { geometry, uniforms } = useMemo(() => {
    const count = isMobile ? 2000 : 5000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    
    const dustColors = [
      new THREE.Color('#4a3a6a'),
      new THREE.Color('#3a4a7a'),
      new THREE.Color('#5a3a5a'),
      new THREE.Color('#2a3a5a'),
    ]
    
    for (let i = 0; i < count; i++) {
      const s = i * 1.234
      const r1 = seededRandom(s * 1.1)
      const r2 = seededRandom(s * 2.2)
      const r3 = seededRandom(s * 3.3)
      const r4 = seededRandom(s * 4.4)
      const r5 = seededRandom(s * 5.5)
      
      // 沿着一条弯曲的带状分布
      const t = r1 * Math.PI * 2
      const bandWidth = 80 + r2 * 60
      const bandHeight = 15 + r3 * 25
      
      // 螺旋形分布
      const spiralR = 200 + r4 * 600
      const spiralAngle = t + spiralR * 0.003
      
      positions[i * 3] = Math.cos(spiralAngle) * spiralR + (r2 - 0.5) * bandWidth
      positions[i * 3 + 1] = (r3 - 0.5) * bandHeight + Math.sin(t * 3) * 10
      positions[i * 3 + 2] = Math.sin(spiralAngle) * spiralR * 0.3 - 300 - r4 * 400
      
      sizes[i] = 0.3 + r5 * 0.8
      alphas[i] = 0.1 + r2 * 0.25
      
      const dustColor = dustColors[Math.floor(r4 * dustColors.length)]
      colors[i * 3] = dustColor.r
      colors[i * 3 + 1] = dustColor.g
      colors[i * 3 + 2] = dustColor.b
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    
    return {
      geometry: geo,
      uniforms: { uTime: { value: 0 } }
    }
  }, [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={starDustVertexShader}
        fragmentShader={starDustFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

// 梦幻星空背景 - 完全固定在3D空间中
const CosmicBackground = memo(function CosmicBackground() {
  const groupRef = useRef<THREE.Group>(null)
  const frameCount = useRef(0)
 
  useFrame((state) => {
    frameCount.current++
    // 降低更新频率：每5帧更新一次（星空旋转很慢，不需要每帧更新）
    if (frameCount.current % 5 !== 0) return
    
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.0003
    }
  })
 
  // 增加粒子数量覆盖更大范围
  const counts = isMobile
    ? { layer1: 5000, layer2: 2000, layer3: 500 }
    : { layer1: 10000, layer2: 4000, layer3: 1000 }
 
  return (
    <>
      <group ref={groupRef}>
        {/* 远景层：覆盖整个场景深度 */}
        <DeepSpaceStars
          count={counts.layer1}
          spread={1200}
          depthRange={[-9000, 500]}
          minSize={0.2}
          maxSize={0.7}
          color="#ffffff"
          saturation={0.08}
          seed={1}
        />
        
        {/* 中景层 */}
        <DeepSpaceStars
          count={counts.layer2}
          spread={800}
          depthRange={[-9000, 500]}
          minSize={0.4}
          maxSize={1.4}
          color="#e0f0ff"
          saturation={0.2}
          seed={1000}
        />
        
        {/* 近景层 - 更亮更大的星星 */}
        <DeepSpaceStars
          count={counts.layer3}
          spread={500}
          depthRange={[-9000, 500]}
          minSize={0.8}
          maxSize={2.5}
          color="#d0e8ff"
          saturation={0.35}
          seed={2000}
        />
      </group>

      {/* 星尘带 */}
      {!isMobile && <StarDustBand />}

      {/* 多层星云 - 更丰富的色彩 */}
      {!isMobile && (
        <>
          {/* 主星云 - 紫蓝渐变 */}
          <Nebula 
            position={[-50, 25, -400]} 
            color1="#1a0a30" 
            color2="#0a1535" 
            color3="#150a25"
            scale={1.4} 
            intensity={1.2}
          />
          {/* 次星云 - 深蓝 */}
          <Nebula 
            position={[60, -20, -450]} 
            color1="#0a1025" 
            color2="#15102a" 
            color3="#0a0a20"
            scale={1.2} 
            intensity={0.9}
          />
          {/* 远景星云 - 淡紫 */}
          <Nebula 
            position={[0, 50, -500]} 
            color1="#200a35" 
            color2="#0a0a25" 
            color3="#150520"
            scale={1.1} 
            intensity={0.7}
          />
          {/* 底部星云 - 深邃 */}
          <Nebula 
            position={[-30, -40, -420]} 
            color1="#0a0520" 
            color2="#050a18" 
            color3="#0a0515"
            scale={1.0} 
            intensity={0.6}
          />
        </>
      )}

      {/* 移动端简化星云 */}
      {isMobile && (
        <Nebula 
          position={[0, 0, -400]} 
          color1="#150a25" 
          color2="#0a1030" 
          color3="#0a0520"
          scale={1.5} 
          intensity={0.8}
        />
      )}
    </>
  )
})

// 后处理效果 - 梦幻光晕
const PostEffects = memo(function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom 
        luminanceThreshold={0.75}
        mipmapBlur
        intensity={0.4}
        radius={0.35}
        levels={4}
      />
      <Vignette offset={0.25} darkness={0.5} />
    </EffectComposer>
  )
})

export function Scene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: cameraFov, near: 0.1, far: 1000 }}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5)}
        frameloop="always"
      >
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 200, 500]} />
        
        <CameraController />
        <CosmicBackground />
        <FloatingPhotos />
        <ToBeContinuedTracker />
        <ShootingStars />
        {!isMobile && <MouseRipple />}
        
        {!isMobile && <PostEffects />}
      </Canvas>
    </div>
  )
}
