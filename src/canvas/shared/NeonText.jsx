import { Text } from '@react-three/drei'

const FONT_URL = 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2'

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
      font={FONT_URL}
      fontSize={fontSize}
      anchorX={anchorX}
      anchorY={anchorY}
      color={color}
      {...props}
    >
      {children}
    </Text>
  )
}
