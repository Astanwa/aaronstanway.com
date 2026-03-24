import { Text } from '@react-three/drei'

export default function NeonText({
  children,
  color = '#00bfff',
  fontSize = 1,
  anchorX = 'center',
  anchorY = 'middle',
  ...props
}) {
  return (
    <Text
      font="/fonts/SpaceGrotesk-Variable.woff2"
      fontSize={fontSize}
      anchorX={anchorX}
      anchorY={anchorY}
      color={color}
      outlineColor={color}
      outlineWidth={fontSize * 0.02}
      {...props}
    >
      {children}
    </Text>
  )
}
