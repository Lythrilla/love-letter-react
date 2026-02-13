import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useAppStore } from '../../store/useAppStore'
import * as THREE from 'three'

export function ToBeContinuedTracker() {
  const groupRef = useRef<THREE.Group>(null)
  const isMemoryMode = useAppStore((s) => s.isMemoryMode)
  const opacityRef = useRef(0)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const camZ = state.camera.position.z
    
    // 文字固定在最前方
    groupRef.current.position.set(0, 0, -7500)
    groupRef.current.lookAt(state.camera.position)
    
    // 根据相机距离计算透明度
    if (isMemoryMode && camZ < -1000) {
      const targetOpacity = Math.min(0.8, (-1000 - camZ) / 400)
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.05
    } else {
      opacityRef.current += (0 - opacityRef.current) * 0.1
    }
    
    // 更新材质透明度
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        (child.material as THREE.MeshBasicMaterial).opacity = opacityRef.current
      }
    })
  })
  
  return (
    <group ref={groupRef}>
      <Text
        fontSize={15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
        material-transparent={true}
        material-opacity={0}
      >
        未完待续
      </Text>
      <Text
        position={[0, -12, 0]}
        fontSize={4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.2}
        material-transparent={true}
        material-opacity={0}
      >
        TO BE CONTINUED
      </Text>
    </group>
  )
}
