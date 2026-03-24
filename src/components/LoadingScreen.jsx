import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function LoadingScreen({ onComplete, waitFor = false }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const reachedEnd = useRef(false)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      // Ramp quickly to 80%, then hold until canvas is ready
      if (current < 80) {
        current += Math.random() * 12 + 4
      } else if (waitFor) {
        current = 100
        reachedEnd.current = true
        clearInterval(interval)
      }
      // Don't go past 80 if canvas isn't ready yet
      setProgress(Math.min(current, waitFor ? 100 : 80))
    }, 120)

    return () => clearInterval(interval)
  }, [waitFor])

  // When waitFor flips to true and we were stuck at 80, finish up
  useEffect(() => {
    if (waitFor && !reachedEnd.current) {
      reachedEnd.current = true
      setProgress(100)
    }
  }, [waitFor])

  // Mark done after reaching 100
  useEffect(() => {
    if (progress >= 100 && !done) {
      const timer = setTimeout(() => setDone(true), 300)
      return () => clearTimeout(timer)
    }
  }, [progress, done])

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => onComplete?.(), 500)
      return () => clearTimeout(timer)
    }
  }, [done, onComplete])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loading-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="loading-title">AARON STANWAY</div>
          <div className="loading-bar-track">
            <div
              className="loading-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-percent">
            {Math.floor(progress)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
