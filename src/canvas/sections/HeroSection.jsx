import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import NeonText from '../shared/NeonText'
import FloatingObject from '../shared/FloatingObject'
import GlowMaterial from '../shared/GlowMaterial'
import { hero } from '../../config/content'

export default function HeroSection() {
  const ring1 = useRef()
  const ring2 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring1.current) ring1.current.rotation.z = t * 0.3
    if (ring2.current) ring2.current.rotation.z = -t * 0.2
  })

  return (
    <group position={[0, 0, 0]}>
      <NeonText fontSize={1.2} color="#00bfff" position={[0, 0.8, 0]}>
        {hero.name}
      </NeonText>
      <NeonText fontSize={0.35} color="#00ff41" position={[0, -0.2, 0]}>
        {hero.tagline}
      </NeonText>
      <NeonText fontSize={0.18} color="#666666" position={[0, -0.9, 0]}>
        {hero.subtitle}
      </NeonText>

      {/* Decorative orbiting rings */}
      <group ref={ring1}>
        <FloatingObject speed={1} floatIntensity={0.3} position={[3, 0.5, -1]}>
          <mesh>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <GlowMaterial color="#00bfff" />
          </mesh>
        </FloatingObject>
      </group>

      <group ref={ring2}>
        <FloatingObject speed={1.5} floatIntensity={0.5} position={[-3.5, -0.3, -2]}>
          <mesh>
            <octahedronGeometry args={[0.25]} />
            <GlowMaterial color="#00ff41" />
          </mesh>
        </FloatingObject>
      </group>

      <FloatingObject speed={2} floatIntensity={0.4} position={[2.5, -1, 0.5]}>
        <mesh>
          <icosahedronGeometry args={[0.15, 0]} />
          <GlowMaterial color="#c084fc" />
        </mesh>
      </FloatingObject>
    </group>
  )
}
