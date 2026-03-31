import type { TaggedFrame, WalkPass } from '../types/gait.types'
import { LM } from './landmarkHelpers'

const DIRECTION_THRESHOLD = 0.05

export function detectPass(
  recentFrames: TaggedFrame[]
): { pass: WalkPass; confidence: number } {
  if (recentFrames.length < 5) return { pass: 'unknown', confidence: 0 }

  const window = recentFrames.slice(-10)

  const hipXs = window.map((f) => {
    const lh = f.landmarks[LM.LEFT_HIP]
    const rh = f.landmarks[LM.RIGHT_HIP]
    if (!lh || !rh) return null
    return (lh.x + rh.x) / 2
  })
  const hipZs = window.map((f) => {
    const lh = f.landmarks[LM.LEFT_HIP]
    const rh = f.landmarks[LM.RIGHT_HIP]
    if (!lh || !rh) return null
    return (lh.z + rh.z) / 2
  })

  const validX = hipXs.filter((v): v is number => v !== null)
  const validZ = hipZs.filter((v): v is number => v !== null)

  if (validX.length < 3 || validZ.length < 3)
    return { pass: 'unknown', confidence: 0 }

  const deltaX = validX[validX.length - 1] - validX[0]
  const deltaZ = validZ[validZ.length - 1] - validZ[0]

  const absDeltaX = Math.abs(deltaX)
  const absDeltaZ = Math.abs(deltaZ)
  const total = absDeltaX + absDeltaZ

  if (total < 0.01) return { pass: 'unknown', confidence: 0 }

  let pass: WalkPass = 'unknown'
  let dominantDelta = 0

  if (absDeltaZ >= absDeltaX) {
    // Z-dominant motion
    if (deltaZ > DIRECTION_THRESHOLD) {
      pass = 'rear'
      dominantDelta = absDeltaZ
    } else if (deltaZ < -DIRECTION_THRESHOLD) {
      pass = 'front'
      dominantDelta = absDeltaZ
    }
  } else {
    // X-dominant motion
    if (deltaX > DIRECTION_THRESHOLD) {
      pass = 'right_side'
      dominantDelta = absDeltaX
    } else if (deltaX < -DIRECTION_THRESHOLD) {
      pass = 'left_side'
      dominantDelta = absDeltaX
    }
  }

  const confidence = total > 0 ? dominantDelta / total : 0
  return { pass, confidence }
}

export function countStridesInPass(frames: TaggedFrame[], side: 'left' | 'right'): number {
  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL
  const heelYs = frames.map((f) => f.landmarks[heelIdx]?.y ?? 0)

  let strikeCount = 0
  for (let i = 1; i < heelYs.length - 1; i++) {
    // Local minimum in Y (heel near ground = higher Y in normalized coords)
    if (heelYs[i] > heelYs[i - 1] && heelYs[i] > heelYs[i + 1]) {
      if (heelYs[i] > 0.7) strikeCount++
    }
  }
  return Math.floor(strikeCount / 2)
}
