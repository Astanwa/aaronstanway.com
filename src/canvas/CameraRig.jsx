import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { Vector3 } from 'three'
import { lerp } from '../utils/math'
import { useUIStore } from '../store/uiStore'

const KEYFRAMES = [
  { offset: 0.0, pos: [0, 0, 8], label: 0 },
  { offset: 0.2, pos: [0, 0, -15], label: 1 },
  { offset: 0.4, pos: [0, 0, -35], label: 1 },
  { offset: 0.6, pos: [0, 0, -45], label: 2 },
  { offset: 0.8, pos: [0, 0, -60], label: 3 },
  { offset: 1.0, pos: [0, 0, -72], label: 4 },
]

const tmpVec = new Vector3()

export default function CameraRig() {
  const scroll = useScroll()
  const setCurrentSection = useUIStore((s) => s.setCurrentSection)
  const lastSection = useRef(-1)

  useFrame((state) => {
    const offset = scroll.offset

    // Find surrounding keyframes
    let i = 0
    while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].offset <= offset) i++
    const a = KEYFRAMES[i]
    const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)]

    const range = b.offset - a.offset
    const t = range > 0 ? (offset - a.offset) / range : 0

    tmpVec.set(
      lerp(a.pos[0], b.pos[0], t),
      lerp(a.pos[1], b.pos[1], t),
      lerp(a.pos[2], b.pos[2], t),
    )

    state.camera.position.lerp(tmpVec, 0.1)

    // Update current section
    const section = t > 0.5 ? b.label : a.label
    if (section !== lastSection.current) {
      lastSection.current = section
      setCurrentSection(section)
    }
  })

  return null
}
