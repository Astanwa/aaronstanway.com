import { useRef, useState } from 'react'
import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export default function FloatingObject({
  children,
  onClick,
  speed = 2,
  floatIntensity = 1,
  rotationIntensity = 0.3,
  ...props
}) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)
  const targetScale = hovered ? 1.08 : 1

  useFrame(() => {
    if (!group.current) return
    const s = group.current.scale.x
    const next = s + (targetScale - s) * 0.1
    group.current.scale.setScalar(next)
  })

  return (
    <Float speed={speed} floatIntensity={floatIntensity} rotationIntensity={rotationIntensity}>
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = onClick ? 'pointer' : 'default'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
        {...props}
      >
        {children}
      </group>
    </Float>
  )
}
