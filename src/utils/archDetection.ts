import type { ArchType, FootLandmarks } from '../types/gait.types'
import { vectorAngle } from './landmarkHelpers'

export function detectArchType(foot: FootLandmarks): ArchType {
  const { heel, ankle, toeIndex } = foot

  // Vector A: HEEL → ANKLE
  const vecA = {
    x: ankle.x - heel.x,
    y: ankle.y - heel.y,
    z: ankle.z - heel.z,
  }

  // Vector B: TOE_INDEX → ANKLE
  const vecB = {
    x: ankle.x - toeIndex.x,
    y: ankle.y - toeIndex.y,
    z: ankle.z - toeIndex.z,
  }

  const archAngle = vectorAngle(vecA, vecB)

  // Ankle vertical position relative to heel/toe midpoint
  const midpointY = (heel.y + toeIndex.y) / 2
  const ankleDrop = ankle.y - midpointY // positive means ankle is lower (flat)

  if (archAngle < 150 || ankleDrop > 0.03) return 'flat'
  if (archAngle > 165) return 'high'
  return 'neutral'
}
