import { Billboard } from '@react-three/drei'
import FloatingObject from '../shared/FloatingObject'
import GlowMaterial from '../shared/GlowMaterial'
import NeonText from '../shared/NeonText'

const CATEGORY_COLORS = {
  language: '#00bfff',
  frontend: '#c084fc',
  backend: '#00ff41',
  ai: '#ff6b35',
  devops: '#ffdd57',
}

export default function SkillOrb({ skill, position }) {
  const color = CATEGORY_COLORS[skill.category] || '#00bfff'
  const radius = 0.12 + skill.level * 0.15

  return (
    <FloatingObject position={position} speed={2} floatIntensity={0.8}>
      <mesh>
        <sphereGeometry args={[radius, 24, 24]} />
        <GlowMaterial color={color} intensity={1.5 + skill.level} />
      </mesh>
      <Billboard position={[0, radius + 0.2, 0]}>
        <NeonText fontSize={0.1} color={color}>
          {skill.name}
        </NeonText>
      </Billboard>
    </FloatingObject>
  )
}
