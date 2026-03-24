import { getGPUTier } from 'detect-gpu'

let cachedTier = null

export async function getGpuTier() {
  if (cachedTier !== null) return cachedTier
  try {
    const result = await getGPUTier()
    cachedTier = result.tier
  } catch {
    cachedTier = 1
  }
  return cachedTier
}

export function getTierConfig(tier) {
  if (tier <= 1) return { mode: 'fallback', particles: 0, dpr: 1, chromatic: false }
  if (tier === 2) return { mode: '3d', particles: 1000, dpr: 1, chromatic: false }
  return { mode: '3d', particles: 3000, dpr: 1.5, chromatic: true }
}
