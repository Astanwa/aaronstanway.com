export const lerp = (a, b, t) => a + (b - a) * t

export const remap = (value, inMin, inMax, outMin, outMax) => {
  const t = (value - inMin) / (inMax - inMin)
  return outMin + (outMax - outMin) * Math.max(0, Math.min(1, t))
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
