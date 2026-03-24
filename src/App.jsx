import { useState, useEffect, useCallback, Suspense, lazy, Component } from 'react'
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
  const [canvasReady, setCanvasReady] = useState(false)
  const [loadingDone, setLoadingDone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [hasWebGL] = useState(() => detectWebGL())

  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true)
  }, [])

  // Show content once both canvas is ready AND loading animation finished
  const showContent = canvasReady && loadingDone

  // Timeout fallback — if canvas never signals ready in 10s, show 2D
  useEffect(() => {
    if (!hasWebGL) return
    if (canvasReady) return
    const timer = setTimeout(() => setTimedOut(true), 10000)
    return () => clearTimeout(timer)
  }, [canvasReady, hasWebGL])

  if (!hasWebGL || timedOut) {
    return <MobileFallback />
  }

  return (
    <>
      {!showContent && <LoadingScreen onComplete={() => setLoadingDone(true)} waitFor={canvasReady} />}
      <ErrorBoundary fallback={<MobileFallback />}>
        <Suspense fallback={null}>
          <Experience onReady={handleCanvasReady} />
        </Suspense>
      </ErrorBoundary>
      {showContent && <HUD />}
    </>
  )
}
