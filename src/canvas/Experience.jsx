import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import CameraRig from './CameraRig'
import Environment from './Environment'
import ParticleField from './effects/ParticleField'
import PostProcessing from './effects/PostProcessing'
import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import SkillsSection from './sections/SkillsSection'
import AboutSection from './sections/AboutSection'
import ContactSection from './sections/ContactSection'

export default function Experience({ config }) {
  const particles = config?.particles ?? 2000
  const dpr = config?.dpr ?? [1, 1.5]
  const chromatic = config?.chromatic ?? true

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 200 }}
      dpr={typeof dpr === 'number' ? [1, dpr] : dpr}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
      style={{ position: 'fixed', inset: 0 }}
      onCreated={({ gl }) => {
        // Force a render to make sure the canvas isn't stuck black
        gl.setClearColor('#000000')
      }}
    >
      <color attach="background" args={['#050510']} />
      <ScrollControls pages={5} damping={0.25}>
        <CameraRig />
        <Environment />
        {particles > 0 && <ParticleField count={particles} />}
        <HeroSection />
        <ProjectsSection />
        <SkillsSection />
        <AboutSection />
        <ContactSection />
      </ScrollControls>
      <PostProcessing chromatic={chromatic} />
    </Canvas>
  )
}
