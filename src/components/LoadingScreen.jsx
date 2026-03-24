import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Simulate loading progress
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5
      if (current >= 100) {
        current = 100
        clearInterval(interval)
        setTimeout(() => setDone(true), 400)
      }
      setProgress(Math.min(current, 100))
    }, 150)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => onComplete?.(), 600)
      return () => clearTimeout(timer)
    }
  }, [done, onComplete])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loading-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="loading-title">PORTFOLIO</div>
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
