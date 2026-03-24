import { useState, useEffect, Suspense, lazy, Component } from 'react'
import LoadingScreen from './components/LoadingScreen'
import MobileFallback from './components/MobileFallback'
import HUD from './components/HUD'

const Experience = lazy(() => import('./canvas/Experience'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('3D Experience failed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [hasWebGL] = useState(() => detectWebGL())

  // If canvas doesn't signal ready in 8 seconds, show fallback
  useEffect(() => {
    if (!hasWebGL) return
    const timer = setTimeout(() => setTimedOut(true), 8000)
    if (loaded) clearTimeout(timer)
    return () => clearTimeout(timer)
  }, [loaded, hasWebGL])

  // No WebGL or timed out — show 2D fallback
  if (!hasWebGL || timedOut) {
    return <MobileFallback />
  }

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <ErrorBoundary fallback={<MobileFallback />}>
        <Suspense fallback={<LoadingScreen onComplete={() => {}} />}>
          <Experience />
        </Suspense>
      </ErrorBoundary>
      {loaded && <HUD />}
    </>
  )
}
