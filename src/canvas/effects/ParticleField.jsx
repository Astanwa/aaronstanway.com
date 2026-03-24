import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

export default function ParticleField({ count = 2000 }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80
      arr[i * 3 + 1] = (Math.random() - 0.5) * 80
      arr[i * 3 + 2] = (Math.random() - 0.5) * 160 - 30
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const time = state.clock.elapsedTime * 0.05
    const posArr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.002
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#00bfff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
