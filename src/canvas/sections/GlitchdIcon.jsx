import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Billboard } from '@react-three/drei'
import { AdditiveBlending, DoubleSide } from 'three'
import NeonText from '../shared/NeonText'

export default function GlitchdIcon({ position = [0, 0, -20] }) {
  const groupRef = useRef()
  const ringRef = useRef()
  const innerRef = useRef()
  const pulseRef = useRef()
  const glitchOffset = useRef(0)

  // Create the scan-line ring vertices
  const ringPoints = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2
      pts.push(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0)
    }
    return new Float32Array(pts)
  }, [])

  // Inner eye/lens shape
  const lensPoints = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2
      const r = 0.5 + Math.sin(a * 2) * 0.15
      pts.push(Math.cos(a) * r, Math.sin(a) * r, 0)
    }
    return new Float32Array(pts)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3
    }

    if (innerRef.current) {
      innerRef.current.rotation.z = -t * 0.5
      const s = 1 + Math.sin(t * 2) * 0.08
      innerRef.current.scale.setScalar(s)
    }

    if (pulseRef.current) {
      const pulse = 0.8 + Math.sin(t * 1.5) * 0.4
      pulseRef.current.material.opacity = pulse * 0.3
      pulseRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.1)
    }

    // Glitch effect — occasional position jitter
    if (groupRef.current) {
      if (Math.random() < 0.02) {
        glitchOffset.current = (Math.random() - 0.5) * 0.08
        setTimeout(() => { glitchOffset.current = 0 }, 50)
      }
      groupRef.current.position.x = position[0] + glitchOffset.current
    }
  })

  const handleClick = () => {
    window.open('https://gltchd.net', '_blank', 'noopener,noreferrer')
  }

  return (
    <Float speed={1.5} floatIntensity={0.6} rotationIntensity={0.1}>
      <group
        ref={groupRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        {/* Outer pulse glow */}
        <mesh ref={pulseRef}>
          <circleGeometry args={[1.6, 64]} />
          <meshBasicMaterial
            color="#00ff41"
            transparent
            opacity={0.15}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>

        {/* Outer ring — spinning scanner */}
        <group ref={ringRef}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={ringPoints}
                count={65}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00ff41" transparent opacity={0.9} />
          </line>

          {/* Tick marks around ring */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2
            const x1 = Math.cos(a) * 1.15
            const y1 = Math.sin(a) * 1.15
            const x2 = Math.cos(a) * 1.3
            const y2 = Math.sin(a) * 1.3
            return (
              <line key={i}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    array={new Float32Array([x1, y1, 0, x2, y2, 0])}
                    count={2}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#00ff41" transparent opacity={0.5} />
              </line>
            )
          })}
        </group>

        {/* Inner lens — rotating eye shape */}
        <group ref={innerRef}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={lensPoints}
                count={49}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00ff41" transparent opacity={0.8} />
          </line>
        </group>

        {/* Center dot — the "pupil" */}
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#00ff41"
            emissive="#00ff41"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        {/* Inner glow disc */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.6, 32]} />
          <meshBasicMaterial
            color="#00ff41"
            transparent
            opacity={0.08}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Title below */}
        <Billboard position={[0, -1.8, 0]}>
          <NeonText fontSize={0.35} color="#00ff41">
            GLitchd
          </NeonText>
        </Billboard>

        <Billboard position={[0, -2.2, 0]}>
          <NeonText fontSize={0.12} color="#888888">
            AI Content Detection — gltchd.net
          </NeonText>
        </Billboard>

        {/* Horizontal scan line that sweeps */}
        <ScanLine />
      </group>
    </Float>
  )
}

function ScanLine() {
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = Math.sin(t * 0.8) * 1.0
    ref.current.material.opacity = 0.3 + Math.sin(t * 2) * 0.2
  })

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2.8, 0.02]} />
      <meshBasicMaterial
        color="#00ff41"
        transparent
        opacity={0.4}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
