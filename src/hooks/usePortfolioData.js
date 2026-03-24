import { useState, useEffect } from 'react'
import * as content from '../config/content'

export function usePortfolioData() {
  const [data, setData] = useState(content)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Phase 5: Fetch from API with fallback to hardcoded content
    // Uncomment when API is ready:
    //
    // setLoading(true)
    // fetch('/api/portfolio/sections')
    //   .then((r) => r.json())
    //   .then((apiData) => setData({ ...content, ...apiData }))
    //   .catch(() => {}) // fallback to hardcoded
    //   .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
