export default function GlowMaterial({ color = '#00bfff' }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={2}
      toneMapped={false}
    />
  )
}
