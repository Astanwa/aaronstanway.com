import { useMemo } from 'react'
import { PlaneGeometry, EdgesGeometry } from 'three'
import NeonText from '../shared/NeonText'
import FloatingObject from '../shared/FloatingObject'
import { useUIStore } from '../../store/uiStore'

export default function ProjectCard3D({ project, position }) {
  const setActiveProject = useUIStore((s) => s.setActiveProject)
  const edges = useMemo(() => new EdgesGeometry(new PlaneGeometry(3.2, 1.8)), [])

  return (
    <FloatingObject
      position={position}
      onClick={() => setActiveProject(project)}
      speed={1.5}
      floatIntensity={0.5}
    >
      <mesh>
        <planeGeometry args={[3.2, 1.8]} />
        <meshStandardMaterial
          color="#000"
          transparent
          opacity={0.4}
          emissive={project.color}
          emissiveIntensity={0.05}
        />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color={project.color} transparent opacity={0.8} />
      </lineSegments>

      <NeonText fontSize={0.28} color={project.color} position={[0, 0.35, 0.01]}>
        {project.title}
      </NeonText>

      <NeonText fontSize={0.13} color="#888888" position={[0, -0.1, 0.01]}>
        {project.tagline}
      </NeonText>

      <NeonText fontSize={0.09} color="#444444" position={[0, -0.5, 0.01]}>
        {project.tech.slice(0, 3).join(' · ')}
      </NeonText>
    </FloatingObject>
  )
}
