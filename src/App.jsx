import { useState, Suspense, lazy, Component } from 'react'
import { useMobile } from './hooks/useMobile'
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

function AppInner() {
  const [loaded, setLoaded] = useState(false)
  const config = useMobile()

  // Still detecting GPU tier
  if (!config) {
    return <LoadingScreen onComplete={() => {}} />
  }

  // Low-end device — skip Three.js entirely
  if (config.mode === 'fallback') {
    return <MobileFallback />
  }

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <ErrorBoundary fallback={<MobileFallback />}>
        <Suspense fallback={<LoadingScreen onComplete={() => {}} />}>
          <Experience config={config} />
        </Suspense>
      </ErrorBoundary>
      {loaded && <HUD />}
    </>
  )
}

export default function App() {
  return <AppInner />
}
