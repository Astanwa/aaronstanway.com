import { useState, useEffect } from 'react'
import { getGpuTier, getTierConfig } from '../utils/gpu'

export function useMobile() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getGpuTier().then((tier) => {
      setConfig(getTierConfig(tier))
    })
  }, [])

  return config
}
