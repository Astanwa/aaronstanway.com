import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { Color, AdditiveBlending } from 'three'

const GlowMaterialImpl = shaderMaterial(
  {
    color: new Color('#00bfff'),
    intensity: 1.5,
    fresnelPower: 2.0,
    time: 0,
  },
  // vertex
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPos.xyz;
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  // fragment
  `
    uniform vec3 color;
    uniform float intensity;
    uniform float fresnelPower;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), fresnelPower);
      vec3 glow = color * intensity * (0.3 + fresnel * 0.7);
      gl_FragColor = vec4(glow, 0.6 + fresnel * 0.4);
    }
  `
)

extend({ GlowMaterialImpl })

export default function GlowMaterial({ color = '#00bfff', intensity = 1.5, ...props }) {
  return (
    <glowMaterialImpl
      color={color}
      intensity={intensity}
      transparent
      blending={AdditiveBlending}
      depthWrite={false}
      {...props}
    />
  )
}
