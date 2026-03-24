import ProjectCard3D from './ProjectCard3D'
import GlitchdIcon from './GlitchdIcon'
import { projects } from '../../config/content'

// GLitchd gets the featured icon, rest get cards
const otherProjects = projects.filter((p) => p.id !== 'glitchd')

const LAYOUT = [
  [-2.5, -0.3, -28],
  [2.5, 0.5, -31],
  [-1, -1, -34],
]

export default function ProjectsSection() {
  return (
    <group>
      {/* Featured GLitchd icon — front and center */}
      <GlitchdIcon position={[0, 0.3, -21]} />

      {/* Other project cards staggered behind */}
      {otherProjects.map((project, i) => (
        <ProjectCard3D
          key={project.id}
          project={project}
          position={LAYOUT[i] || [0, 0, -28 - i * 4]}
        />
      ))}
    </group>
  )
}
