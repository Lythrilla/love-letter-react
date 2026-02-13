import { Canvas, useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls, Stars, Float } from '@react-three/drei'

// 简单的哈希函数生成确定性随机数
function hashStringToFloat(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

// 核心能量球 Shader
const coreVertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Simplex Noise (简化版)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // 顶点位移
    float noiseVal = snoise(position * 2.0 + uTime * uSpeed);
    vDisplacement = noiseVal;
    
    vec3 newPos = position + normal * (noiseVal * 0.2);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`

const coreFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    // 菲涅尔效应 (边缘发光)
    vec3 viewDir = normalize(cameraPosition - vNormal); 
    // 近似
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

    // 颜色混合
    vec3 color = mix(uColorA, uColorB, vDisplacement * 0.5 + 0.5);
    
    // 核心发光
    color += fresnel * uColorB * 2.0;
    
    // 强度调整
    color *= uIntensity;

    gl_FragColor = vec4(color, 0.9);
  }
`

const FluxCore = memo(function FluxCore({ colorA, colorB }: { colorA: THREE.Color, colorB: THREE.Color }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.4 },
    uColorA: { value: colorA },
    uColorB: { value: colorB },
    uIntensity: { value: 1.5 }
  }), [colorA, colorB])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.z += 0.001
      // @ts-expect-error shader material uniforms
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 64]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </Float>
  )
})

const ParticleField = memo(function ParticleField({ color }: { color: THREE.Color }) {
  const count = 150
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for(let i=0; i<count; i++) {
      const r = 3 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

export const EasterEggScene = memo(function EasterEggScene({ eggId }: { eggId: string }) {
  const { colorA, colorB, bgGradient } = useMemo(() => {
    const seed = hashStringToFloat(eggId)
    // 生成两个高饱和互补色
    const hue1 = seed
    const hue2 = (seed + 0.5) % 1
    
    const c1 = new THREE.Color().setHSL(hue1, 0.9, 0.5)
    const c2 = new THREE.Color().setHSL(hue2, 0.9, 0.5)
    
    // 背景稍微暗一点
    const bg1 = new THREE.Color().setHSL(hue1, 0.6, 0.05).getStyle()
    
    return {
      colorA: c1,
      colorB: c2,
      bgGradient: `radial-gradient(circle at center, ${bg1} 0%, #000000 100%)`
    }
  }, [eggId])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: bgGradient, // 深邃背景
        pointerEvents: 'auto', // 允许旋转查看
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color={colorA} />
        <pointLight position={[-10, -10, -10]} intensity={1} color={colorB} />

        <FluxCore colorA={colorA} colorB={colorB} />
        <ParticleField color={colorA} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <fog attach="fog" args={['#000000', 5, 15]} />
      </Canvas>
    </div>
  )
})
