import NeonText from '../shared/NeonText'
import FloatingObject from '../shared/FloatingObject'
import GlowMaterial from '../shared/GlowMaterial'
import { about } from '../../config/content'

export default function AboutSection() {
  const lines = about.bio.split('\n').filter(Boolean)

  return (
    <group position={[0, 0, -60]}>
      <NeonText fontSize={0.4} color="#00bfff" position={[0, 2, 0]}>
        About
      </NeonText>

      {/* Semi-transparent background panel */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#000" transparent opacity={0.3} />
      </mesh>

      {lines.map((line, i) => (
        <NeonText
          key={i}
          fontSize={0.13}
          color="#cccccc"
          position={[0, 0.8 - i * 0.7, 0]}
          maxWidth={7}
          textAlign="center"
        >
          {line}
        </NeonText>
      ))}

      {/* Decorative elements */}
      <FloatingObject position={[-4.5, 1.5, 1]} speed={1} floatIntensity={0.5}>
        <mesh>
          <dodecahedronGeometry args={[0.2]} />
          <GlowMaterial color="#00ff41" intensity={1} />
        </mesh>
      </FloatingObject>

      <FloatingObject position={[4.5, -1, 0.5]} speed={1.5} floatIntensity={0.4}>
        <mesh>
          <tetrahedronGeometry args={[0.18]} />
          <GlowMaterial color="#c084fc" intensity={1} />
        </mesh>
      </FloatingObject>
    </group>
  )
}
