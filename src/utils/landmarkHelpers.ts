import type { Landmark3D } from '../types/gait.types'

export const LM = {
  NOSE: 0,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
}

export function getLandmark(
  landmarks: Landmark3D[],
  index: number,
  minVisibility = 0.5
): Landmark3D | null {
  const lm = landmarks[index]
  if (!lm) return null
  if ((lm.visibility ?? 1) < minVisibility) return null
  return lm
}

export function midpoint(a: Landmark3D, b: Landmark3D): Landmark3D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  }
}

export function vectorAngle(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z
  const magA = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)
  const magB = Math.sqrt(b.x ** 2 + b.y ** 2 + b.z ** 2)
  if (magA === 0 || magB === 0) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

export function vector2DAngleDeg(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}
