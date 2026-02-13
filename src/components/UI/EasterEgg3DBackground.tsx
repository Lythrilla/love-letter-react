import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ==================== 极光粒子流效果 ====================

const auroraVertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float offset;
  attribute float speed;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float uTime;
  
  void main() {
    vColor = color;
    
    vec3 pos = position;
    
    // 波浪流动
    float wave = sin(pos.x * 0.5 + uTime * speed + offset) * 2.0;
    float wave2 = cos(pos.z * 0.3 + uTime * speed * 0.7 + offset) * 1.5;
    pos.y += wave + wave2;
    
    // 水平漂移
    pos.x += sin(uTime * 0.2 + offset) * 3.0;
    pos.z += cos(uTime * 0.15 + offset * 1.3) * 2.0;
    
    // 呼吸透明度
    float breath = sin(uTime * 1.5 + offset * 2.0) * 0.3 + 0.7;
    vAlpha = breath * 0.8;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * breath * (250.0 / -mvPosition.z);
  }
`

// 螺旋星云
const spiralVertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float angle;
  attribute float radius;
  attribute float height;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float uTime;
  
  void main() {
    vColor = color;
    
    // 螺旋旋转
    float a = angle + uTime * 0.3;
    float r = radius + sin(uTime * 0.5 + angle) * 0.5;
    
    vec3 pos = vec3(
      cos(a) * r,
      height + sin(a * 3.0 + uTime) * 0.5,
      sin(a) * r
    );
    
    // 闪烁
    float flicker = sin(uTime * 4.0 + angle * 5.0) * 0.3 + 0.7;
    vAlpha = flicker * 0.9;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * flicker * (220.0 / -mvPosition.z);
  }
`

// 漂浮光点
const floatVertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float phase;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float uTime;
  
  void main() {
    vColor = color;
    
    vec3 pos = position;
    
    // 缓慢漂浮
    pos.x += sin(uTime * 0.3 + phase) * 1.0;
    pos.y += cos(uTime * 0.25 + phase * 1.2) * 0.8;
    pos.z += sin(uTime * 0.2 + phase * 0.8) * 0.5;
    
    // 闪烁
    float twinkle = sin(uTime * 2.0 + phase * 3.0);
    twinkle = twinkle * 0.5 + 0.5;
    twinkle = pow(twinkle, 2.0);
    vAlpha = 0.4 + twinkle * 0.6;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * (0.6 + twinkle * 0.6) * (200.0 / -mvPosition.z);
  }
`

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    float core = smoothstep(0.5, 0.0, dist);
    float glow = smoothstep(0.5, 0.15, dist) * 0.4;
    float alpha = (core + glow) * vAlpha;
    
    vec3 finalColor = vColor + vec3(0.3) * core;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ==================== 数据生成 ====================

function generateAuroraData(count: number, colors: THREE.Color[]) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const particleColors = new Float32Array(count * 3)
  const offsets = new Float32Array(count)
  const speeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // 水平带状分布
    positions[i * 3] = (Math.random() - 0.5) * 30
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5

    sizes[i] = 1.5 + Math.random() * 2.5
    offsets[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.5 + Math.random() * 0.5

    const color = colors[Math.floor(Math.random() * colors.length)]
    particleColors[i * 3] = color.r
    particleColors[i * 3 + 1] = color.g
    particleColors[i * 3 + 2] = color.b
  }

  return { positions, sizes, particleColors, offsets, speeds }
}

function generateSpiralData(count: number, colors: THREE.Color[]) {
  const sizes = new Float32Array(count)
  const particleColors = new Float32Array(count * 3)
  const angles = new Float32Array(count)
  const radii = new Float32Array(count)
  const heights = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const t = i / count
    angles[i] = t * Math.PI * 6 // 3圈螺旋
    radii[i] = 2 + t * 4 + Math.random() * 0.5
    heights[i] = (Math.random() - 0.5) * 2

    sizes[i] = 2 + Math.random() * 2

    const color = colors[Math.floor(Math.random() * colors.length)]
    particleColors[i * 3] = color.r
    particleColors[i * 3 + 1] = color.g
    particleColors[i * 3 + 2] = color.b
  }

  return { sizes, particleColors, angles, radii, heights }
}

function generateFloatData(count: number, colors: THREE.Color[]) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const particleColors = new Float32Array(count * 3)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // 球形分布
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 8 + Math.random() * 8

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi) - 3

    sizes[i] = 1 + Math.random() * 2
    phases[i] = Math.random() * Math.PI * 2

    const color = colors[Math.floor(Math.random() * colors.length)]
    particleColors[i * 3] = color.r * 0.7 + 0.3
    particleColors[i * 3 + 1] = color.g * 0.7 + 0.3
    particleColors[i * 3 + 2] = color.b * 0.7 + 0.3
  }

  return { positions, sizes, particleColors, phases }
}

// ==================== 3D 组件 ====================

function AuroraParticles({ colors }: { colors: THREE.Color[] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const [data] = useState(() => generateAuroraData(150, colors))

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[data.particleColors, 3]} />
        <bufferAttribute attach="attributes-offset" args={[data.offsets, 1]} />
        <bufferAttribute attach="attributes-speed" args={[data.speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function SpiralNebula({ colors }: { colors: THREE.Color[] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [data] = useState(() => generateSpiralData(120, colors))

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const positions = useMemo(() => new Float32Array(120 * 3), [])

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
          <bufferAttribute attach="attributes-color" args={[data.particleColors, 3]} />
          <bufferAttribute attach="attributes-angle" args={[data.angles, 1]} />
          <bufferAttribute attach="attributes-radius" args={[data.radii, 1]} />
          <bufferAttribute attach="attributes-height" args={[data.heights, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={spiralVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

function FloatingStars({ colors }: { colors: THREE.Color[] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [data] = useState(() => generateFloatData(200, colors))

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
          <bufferAttribute attach="attributes-color" args={[data.particleColors, 3]} />
          <bufferAttribute attach="attributes-phase" args={[data.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={floatVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

// ==================== 主组件 ====================

interface EasterEgg3DBackgroundProps {
  colorScheme?: string[]
}

export function EasterEgg3DBackground({ colorScheme }: EasterEgg3DBackgroundProps) {
  const colors = useMemo(() => {
    const defaultColors = ['#ff3cac', '#784ba0', '#2b86c5', '#ffd166', '#00f5d4']
    const scheme = colorScheme || defaultColors
    return scheme.map(c => new THREE.Color(c))
  }, [colorScheme])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* 背景漂浮星星 */}
        <FloatingStars colors={colors} />
        
        {/* 螺旋星云 */}
        <SpiralNebula colors={colors} />
        
        {/* 极光粒子流 */}
        <AuroraParticles colors={colors} />
      </Canvas>
    </div>
  )
}
