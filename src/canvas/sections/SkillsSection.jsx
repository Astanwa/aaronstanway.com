import { useMemo } from 'react'
import SkillOrb from './SkillOrb'
import { skills } from '../../config/content'

export default function SkillsSection() {
  const positions = useMemo(() => {
    const categoryOffsets = {
      language: [-3, 0],
      frontend: [-1, 1.5],
      backend: [1, -1],
      ai: [3, 0.5],
      devops: [0, -2],
    }

    return skills.map((skill, i) => {
      const offset = categoryOffsets[skill.category] || [0, 0]
      const angle = (i * 137.5 * Math.PI) / 180 // golden angle
      const r = 0.8 + i * 0.15
      return [
        offset[0] + Math.cos(angle) * r * 0.5,
        offset[1] + Math.sin(angle) * r * 0.4,
        -47 + (Math.random() - 0.5) * 3,
      ]
    })
  }, [])

  return (
    <group>
      {skills.map((skill, i) => (
        <SkillOrb key={skill.name} skill={skill} position={positions[i]} />
      ))}
    </group>
  )
}
