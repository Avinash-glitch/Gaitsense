import type { Landmark3D } from '../types/gait.types'

export function movingAverage(values: number[], windowSize: number): number[] {
  if (values.length === 0) return []
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(values.length, start + windowSize)
    const window = values.slice(start, end)
    result.push(window.reduce((a, b) => a + b, 0) / window.length)
  }
  return result
}

export function smoothLandmarkAxis(frames: number[], windowSize = 5): number[] {
  return movingAverage(frames, windowSize)
}

export function smoothFrames(
  frames: Landmark3D[][],
  windowSize = 5
): Landmark3D[][] {
  if (frames.length === 0) return []
  const numLandmarks = frames[0].length
  const result: Landmark3D[][] = frames.map((f) => f.map((lm) => ({ ...lm })))

  for (let lmIdx = 0; lmIdx < numLandmarks; lmIdx++) {
    const xs = frames.map((f) => f[lmIdx]?.x ?? 0)
    const ys = frames.map((f) => f[lmIdx]?.y ?? 0)
    const zs = frames.map((f) => f[lmIdx]?.z ?? 0)

    const smoothX = movingAverage(xs, windowSize)
    const smoothY = movingAverage(ys, windowSize)
    const smoothZ = movingAverage(zs, windowSize)

    for (let fIdx = 0; fIdx < frames.length; fIdx++) {
      if (result[fIdx][lmIdx]) {
        result[fIdx][lmIdx].x = smoothX[fIdx]
        result[fIdx][lmIdx].y = smoothY[fIdx]
        result[fIdx][lmIdx].z = smoothZ[fIdx]
      }
    }
  }

  return result
}
