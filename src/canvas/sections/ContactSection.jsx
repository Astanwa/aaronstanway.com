import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import NeonText from '../shared/NeonText'
import GlowMaterial from '../shared/GlowMaterial'
import { contact } from '../../config/content'

export default function ContactSection() {
  const orbRef = useRef()

  useFrame((state) => {
    if (!orbRef.current) return
    const t = state.clock.elapsedTime
    orbRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05)
  })

  return (
    <group position={[0, 0, -72]}>
      {/* Large glowing CTA orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <GlowMaterial color="#00bfff" intensity={2} fresnelPower={3} />
      </mesh>

      <NeonText fontSize={0.35} color="#00bfff" position={[0, 2.5, 0]}>
        {contact.heading}
      </NeonText>

      <NeonText fontSize={0.13} color="#888888" position={[0, 2, 0]} maxWidth={6} textAlign="center">
        {contact.subheading}
      </NeonText>

      {contact.links.map((link, i) => (
        <NeonText
          key={link.label}
          fontSize={0.16}
          color="#00ff41"
          position={[(i - 1) * 2, -2, 0]}
        >
          {link.label}
        </NeonText>
      ))}
    </group>
  )
}
