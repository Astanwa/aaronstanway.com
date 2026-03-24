import { useState, Suspense, lazy } from 'react'
import LoadingScreen from './components/LoadingScreen'
import HUD from './components/HUD'

const Experience = lazy(() => import('./canvas/Experience'))

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      {loaded && <HUD />}
    </>
  )
}
