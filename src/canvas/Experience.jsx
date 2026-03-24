import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll, Text } from '@react-three/drei'
import CameraRig from './CameraRig'
import ParticleField from './effects/ParticleField'
import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import SkillsSection from './sections/SkillsSection'
import AboutSection from './sections/AboutSection'
import ContactSection from './sections/ContactSection'

export default function Experience({ onReady }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ position: 'fixed', inset: 0 }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={['#070714']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} color="#00bfff" intensity={3} distance={100} />
      <pointLight position={[-10, -5, -30]} color="#00ff41" intensity={2} distance={100} />
      <pointLight position={[0, 8, -60]} color="#c084fc" intensity={2} distance={80} />
      <ScrollControls pages={5} damping={0.25}>
        <CameraRig />
        <ParticleField count={1500} />
        <HeroSection />
        <ProjectsSection />
        <SkillsSection />
        <AboutSection />
        <ContactSection />
      </ScrollControls>
    </Canvas>
  )
}
