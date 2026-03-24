import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

export default function PostProcessing({ chromatic = true }) {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      {chromatic && (
        <ChromaticAberration
          offset={new Vector2(0.0006, 0.0006)}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  )
}
