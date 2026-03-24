import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { FogExp2 } from 'three'

export default function Environment() {
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new FogExp2('#000000', 0.012)
    return () => { scene.fog = null }
  }, [scene])

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[10, 10, -20]} color="#00bfff" intensity={2} distance={60} />
      <pointLight position={[-10, -5, -50]} color="#00ff41" intensity={1.5} distance={60} />
      <pointLight position={[0, 8, -70]} color="#c084fc" intensity={1} distance={40} />
    </>
  )
}
