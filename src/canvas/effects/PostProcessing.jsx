import { useState, useEffect } from 'react'

let EffectComposer, Bloom, Vignette, ChromaticAberration, BlendFunction, Vector2

export default function PostProcessing({ chromatic = true }) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Dynamically import post-processing to catch failures
    Promise.all([
      import('@react-three/postprocessing'),
      import('postprocessing'),
      import('three'),
    ])
      .then(([r3pp, pp, three]) => {
        EffectComposer = r3pp.EffectComposer
        Bloom = r3pp.Bloom
        Vignette = r3pp.Vignette
        ChromaticAberration = r3pp.ChromaticAberration
        BlendFunction = pp.BlendFunction
        Vector2 = three.Vector2
        setReady(true)
      })
      .catch((err) => {
        console.warn('PostProcessing unavailable:', err)
        setFailed(true)
      })
  }, [])

  if (failed || !ready) return null

  try {
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
  } catch (err) {
    console.warn('PostProcessing render failed:', err)
    return null
  }
}
