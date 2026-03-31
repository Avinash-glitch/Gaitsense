import type {
  TaggedFrame,
  GaitSide,
  StepEvent,
  StrikePattern,
  FootLandmarks,
  ArchType,
  GaitMetrics,
  Recommendation,
  StepTimelineEntry,
} from '../types/gait.types'
import { LM, getLandmark, vectorAngle } from './landmarkHelpers'
import { smoothLandmarkAxis } from './smoothing'
import { detectArchType } from './archDetection'

// ── A. Step Detection ──────────────────────────────────────
export function detectStepEvents(
  frames: TaggedFrame[],
  side: GaitSide
): StepEvent[] {
  if (frames.length < 10) return []

  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL
  const toeIdx = side === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX

  const rawHeelYs = frames.map((f) => f.landmarks[heelIdx]?.y ?? 0)
  const smoothedY = smoothLandmarkAxis(rawHeelYs, 5)

  const events: StepEvent[] = []

  for (let i = 1; i < smoothedY.length - 1; i++) {
    const isLocalMax =
      smoothedY[i] > smoothedY[i - 1] && smoothedY[i] > smoothedY[i + 1]

    if (!isLocalMax || smoothedY[i] < 0.6) continue

    // Find subsequent local minimum (toe-off)
    let toeOffIdx = -1
    for (let j = i + 1; j < Math.min(i + 90, smoothedY.length - 1); j++) {
      if (smoothedY[j] < smoothedY[j - 1] && smoothedY[j] < smoothedY[j + 1]) {
        toeOffIdx = j
        break
      }
    }
    if (toeOffIdx === -1) continue

    const frameLandmarks = frames[i].landmarks
    const heelLm = getLandmark(frameLandmarks, heelIdx)
    const toeLm = getLandmark(frameLandmarks, toeIdx)

    let strikePattern: StrikePattern = 'heel'
    if (heelLm && toeLm) {
      const diff = heelLm.y - toeLm.y
      if (Math.abs(diff) <= 0.02) strikePattern = 'midfoot'
      else if (toeLm.y > heelLm.y) strikePattern = 'forefoot'
      else strikePattern = 'heel'
    }

    const strikeTime = frames[i].timestamp
    const toeOffTime = frames[toeOffIdx].timestamp
    const duration = (toeOffTime - strikeTime) / 1000

    if (duration < 0.3 || duration > 2.0) continue

    events.push({
      side,
      strikeTimestamp: strikeTime,
      toeOffTimestamp: toeOffTime,
      duration,
      strikePattern,
      pass: frames[i].pass,
    })
  }

  return events
}

// ── B. Cadence ─────────────────────────────────────────────
export function calculateCadence(stepEvents: StepEvent[]): number {
  if (stepEvents.length < 2) return 0
  const sorted = [...stepEvents].sort((a, b) => a.strikeTimestamp - b.strikeTimestamp)
  const totalDuration =
    (sorted[sorted.length - 1].strikeTimestamp - sorted[0].strikeTimestamp) / 1000
  if (totalDuration <= 0) return 0
  return (stepEvents.length / totalDuration) * 60
}

// ── C. Symmetry ────────────────────────────────────────────
export function calculateSymmetry(
  leftSteps: StepEvent[],
  rightSteps: StepEvent[]
): number {
  if (leftSteps.length === 0 || rightSteps.length === 0) return 50

  const leftAvg = leftSteps.reduce((s, e) => s + e.duration, 0) / leftSteps.length
  const rightAvg = rightSteps.reduce((s, e) => s + e.duration, 0) / rightSteps.length

  if (leftAvg + rightAvg === 0) return 50
  const asymmetry = (Math.abs(leftAvg - rightAvg) / ((leftAvg + rightAvg) / 2)) * 100
  return Math.max(0, Math.min(100, 100 - asymmetry))
}

// ── D. Arch Detection ──────────────────────────────────────
export function detectArchFromFrames(
  frames: TaggedFrame[],
  side: GaitSide
): ArchType {
  const sideFrames = frames.filter(
    (f) => f.pass === 'left_side' || f.pass === 'right_side'
  )
  if (sideFrames.length < 5) return 'neutral'

  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL
  const ankleIdx = side === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE
  const toeIdx = side === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX
  const kneeIdx = side === 'left' ? LM.LEFT_KNEE : LM.RIGHT_KNEE
  const hipIdx = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP

  const archResults: ArchType[] = []

  for (const frame of sideFrames) {
    const heel = getLandmark(frame.landmarks, heelIdx)
    const ankle = getLandmark(frame.landmarks, ankleIdx)
    const toe = getLandmark(frame.landmarks, toeIdx)
    const knee = getLandmark(frame.landmarks, kneeIdx)
    const hip = getLandmark(frame.landmarks, hipIdx)

    if (!heel || !ankle || !toe || !knee || !hip) continue

    const footLandmarks: FootLandmarks = {
      heel,
      ankle,
      toeIndex: toe,
      knee,
      hip,
    }
    archResults.push(detectArchType(footLandmarks))
  }

  if (archResults.length === 0) return 'neutral'

  const counts = { flat: 0, neutral: 0, high: 0 }
  for (const r of archResults) counts[r]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ArchType
}

// ── E. Toe Angle ───────────────────────────────────────────
export function calculateToeAngle(
  frames: TaggedFrame[],
  side: GaitSide
): number {
  const relevantFrames = frames.filter(
    (f) => f.pass === 'front' || f.pass === 'rear'
  )
  if (relevantFrames.length < 5) return 8

  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL
  const toeIdx = side === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX

  const angles: number[] = []

  for (const frame of relevantFrames) {
    const heel = getLandmark(frame.landmarks, heelIdx)
    const toe = getLandmark(frame.landmarks, toeIdx)
    if (!heel || !toe) continue

    const footVec = { x: toe.x - heel.x, y: toe.y - heel.y }
    const forwardVec = { x: 0, y: frame.pass === 'rear' ? 1 : -1 }

    const dot = footVec.x * forwardVec.x + footVec.y * forwardVec.y
    const magFoot = Math.sqrt(footVec.x ** 2 + footVec.y ** 2)
    if (magFoot === 0) continue

    const cosA = Math.max(-1, Math.min(1, dot / magFoot))
    const angle = (Math.acos(cosA) * 180) / Math.PI

    // Determine toe-out (positive) vs toe-in (negative) using cross product
    const cross = footVec.x * forwardVec.y - footVec.y * forwardVec.x
    angles.push(cross > 0 ? angle : -angle)
  }

  if (angles.length === 0) return 8
  return angles.reduce((a, b) => a + b, 0) / angles.length
}

// ── F. Ankle Dorsiflexion ──────────────────────────────────
export function calculateDorsiflexion(
  frames: TaggedFrame[],
  side: GaitSide
): number {
  const sideFrames = frames.filter(
    (f) => f.pass === 'left_side' || f.pass === 'right_side'
  )
  if (sideFrames.length < 5) return 5

  const kneeIdx = side === 'left' ? LM.LEFT_KNEE : LM.RIGHT_KNEE
  const ankleIdx = side === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE
  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL

  const angles: number[] = []

  for (const frame of sideFrames) {
    const knee = getLandmark(frame.landmarks, kneeIdx)
    const ankle = getLandmark(frame.landmarks, ankleIdx)
    const heel = getLandmark(frame.landmarks, heelIdx)

    if (!knee || !ankle || !heel) continue

    const kneeToAnkle = {
      x: ankle.x - knee.x,
      y: ankle.y - knee.y,
      z: ankle.z - knee.z,
    }
    const heelToAnkle = {
      x: ankle.x - heel.x,
      y: ankle.y - heel.y,
      z: ankle.z - heel.z,
    }

    const angle = vectorAngle(kneeToAnkle, heelToAnkle)
    angles.push(angle - 90) // convert to dorsiflexion (0° = neutral)
  }

  if (angles.length === 0) return 5
  return angles.reduce((a, b) => a + b, 0) / angles.length
}

// ── G. Hip Drop Detection ──────────────────────────────────
export function detectHipDrop(frames: TaggedFrame[]): boolean {
  const relevantFrames = frames.filter(
    (f) => f.pass === 'front' || f.pass === 'rear'
  )
  if (relevantFrames.length < 10) return false

  let dropCount = 0
  for (const frame of relevantFrames) {
    const lHip = getLandmark(frame.landmarks, LM.LEFT_HIP)
    const rHip = getLandmark(frame.landmarks, LM.RIGHT_HIP)
    if (!lHip || !rHip) continue

    if (Math.abs(lHip.y - rHip.y) > 0.04) dropCount++
  }

  return dropCount / relevantFrames.length > 0.3
}

// ── H. Heel Whip Detection ─────────────────────────────────
export function detectHeelWhip(frames: TaggedFrame[]): boolean {
  const rearFrames = frames.filter((f) => f.pass === 'rear')
  if (rearFrames.length < 10) return false

  let whipCount = 0
  let checked = 0

  for (let i = 1; i < rearFrames.length; i++) {
    const lHeel = getLandmark(rearFrames[i].landmarks, LM.LEFT_HEEL)
    const lAnkle = getLandmark(rearFrames[i].landmarks, LM.LEFT_ANKLE)
    const rHeel = getLandmark(rearFrames[i].landmarks, LM.RIGHT_HEEL)
    const rAnkle = getLandmark(rearFrames[i].landmarks, LM.RIGHT_ANKLE)

    if (lHeel && lAnkle) {
      checked++
      if (Math.abs(lHeel.x - lAnkle.x) > 0.06) whipCount++
    }
    if (rHeel && rAnkle) {
      checked++
      if (Math.abs(rHeel.x - rAnkle.x) > 0.06) whipCount++
    }
  }

  return checked > 0 && whipCount / checked > 0.2
}

// ── I. Scissor Gait Detection ──────────────────────────────
export function detectScissorGait(frames: TaggedFrame[]): boolean {
  const relevantFrames = frames.filter(
    (f) => f.pass === 'front' || f.pass === 'rear'
  )
  if (relevantFrames.length < 10) return false

  let scissorCount = 0
  for (const frame of relevantFrames) {
    const lHeel = getLandmark(frame.landmarks, LM.LEFT_HEEL)
    const rHeel = getLandmark(frame.landmarks, LM.RIGHT_HEEL)
    if (!lHeel || !rHeel) continue
    if (Math.abs(lHeel.x - rHeel.x) < 0.03) scissorCount++
  }

  return scissorCount / relevantFrames.length > 0.3
}

// ── J. Overpronation ───────────────────────────────────────
export function detectOverpronation(
  archType: ArchType,
  ankleDropValue: number,
  strikePattern: StrikePattern
): boolean {
  return (
    archType === 'flat' &&
    ankleDropValue > 0.02 &&
    (strikePattern === 'heel' || strikePattern === 'midfoot')
  )
}

// ── K. Leg Length Discrepancy ──────────────────────────────
export function detectLegLengthDiscrepancy(frames: TaggedFrame[]): boolean {
  const sideFrames = frames.filter(
    (f) => f.pass === 'left_side' || f.pass === 'right_side'
  )
  if (sideFrames.length < 10) return false

  const leftHipYs: number[] = []
  const rightHipYs: number[] = []

  for (const frame of sideFrames) {
    const lHip = getLandmark(frame.landmarks, LM.LEFT_HIP)
    const rHip = getLandmark(frame.landmarks, LM.RIGHT_HIP)
    if (lHip) leftHipYs.push(lHip.y)
    if (rHip) rightHipYs.push(rHip.y)
  }

  if (leftHipYs.length === 0 || rightHipYs.length === 0) return false

  const leftAvg = leftHipYs.reduce((a, b) => a + b, 0) / leftHipYs.length
  const rightAvg = rightHipYs.reduce((a, b) => a + b, 0) / rightHipYs.length

  return Math.abs(leftAvg - rightAvg) > 0.025
}

// ── L. Gait Score ──────────────────────────────────────────
export function calculateGaitScore(metrics: GaitMetrics): number {
  let score = 0

  // Symmetry: 25 points
  score += (metrics.symmetryScore / 100) * 25

  // Cadence in range 100-120: 20 points
  if (metrics.cadence >= 100 && metrics.cadence <= 120) {
    score += 20
  } else if (metrics.cadence > 0) {
    const dist = Math.min(Math.abs(metrics.cadence - 100), Math.abs(metrics.cadence - 120))
    score += Math.max(0, 20 - dist * 0.5)
  }

  // Strike pattern: 15 points (midfoot best, forefoot ok, heel deduction)
  const leftScore =
    metrics.leftStrikePattern === 'midfoot'
      ? 15
      : metrics.leftStrikePattern === 'forefoot'
      ? 10
      : 5
  const rightScore =
    metrics.rightStrikePattern === 'midfoot'
      ? 15
      : metrics.rightStrikePattern === 'forefoot'
      ? 10
      : 5
  score += (leftScore + rightScore) / 2

  // Toe angle in normal range: 10 points
  const leftToeOk =
    metrics.leftToeAngle >= 5 && metrics.leftToeAngle <= 18
  const rightToeOk =
    metrics.rightToeAngle >= 5 && metrics.rightToeAngle <= 18
  score += (leftToeOk ? 5 : 0) + (rightToeOk ? 5 : 0)

  // No pathological patterns: 15 points
  let pathScore = 15
  if (metrics.hipDropDetected) pathScore -= 5
  if (metrics.heelWhipDetected) pathScore -= 5
  if (metrics.scissorGaitDetected) pathScore -= 5
  score += Math.max(0, pathScore)

  // Arch type: 15 points (neutral best)
  const archScore = (arch: ArchType) =>
    arch === 'neutral' ? 15 : arch === 'high' ? 10 : 5
  score += (archScore(metrics.leftArch) + archScore(metrics.rightArch)) / 2

  return Math.round(Math.max(0, Math.min(100, score)))
}

// ── M. Recommendations ─────────────────────────────────────
export function generateRecommendations(metrics: GaitMetrics): Recommendation[] {
  const recs: Recommendation[] = []

  if (metrics.leftArch === 'flat' || metrics.rightArch === 'flat') {
    recs.push({
      severity: 'warning',
      category: 'footwear',
      title: 'Flat arch detected',
      detail:
        'Consider motion control or stability footwear and custom orthotics.',
    })
  }

  if (metrics.overpronationLeft || metrics.overpronationRight) {
    recs.push({
      severity: 'concern',
      category: 'medical',
      title: 'Overpronation detected',
      detail:
        'Overpronation detected — consider podiatry or physiotherapy assessment.',
    })
  }

  if (
    (metrics.leftStrikePattern === 'heel' || metrics.rightStrikePattern === 'heel') &&
    metrics.cadence < 100
  ) {
    recs.push({
      severity: 'warning',
      category: 'strengthening',
      title: 'Heel strike with low cadence',
      detail:
        'Heel striking may increase impact — try increasing cadence by 5–10%.',
    })
  }

  if (metrics.hipDropDetected) {
    recs.push({
      severity: 'concern',
      category: 'strengthening',
      title: 'Hip drop detected',
      detail:
        'Hip drop suggests weak hip abductors — add side-lying clamshells and glute med exercises.',
    })
  }

  if (metrics.heelWhipDetected) {
    recs.push({
      severity: 'warning',
      category: 'medical',
      title: 'Heel whip detected',
      detail:
        'Heel whip may indicate hip or knee rotation issue — consider physio evaluation.',
    })
  }

  if (metrics.leftToeAngle > 20 || metrics.rightToeAngle > 20) {
    recs.push({
      severity: 'info',
      category: 'stretching',
      title: 'Excessive toe-out',
      detail:
        'Excessive toe-out may indicate tight hip external rotators — try pigeon stretch.',
    })
  }

  if (metrics.leftToeAngle < 0 || metrics.rightToeAngle < 0) {
    recs.push({
      severity: 'warning',
      category: 'medical',
      title: 'Toe-in gait detected',
      detail:
        'Toe-in gait detected — may indicate internal tibial torsion, see a specialist.',
    })
  }

  if (metrics.leftAnkleDorsiflexion < 0 || metrics.rightAnkleDorsiflexion < 0) {
    recs.push({
      severity: 'warning',
      category: 'stretching',
      title: 'Limited ankle dorsiflexion',
      detail:
        'Limited ankle dorsiflexion — calf stretching and ankle mobility work recommended.',
    })
  }

  if (metrics.legLengthDiscrepancy) {
    recs.push({
      severity: 'concern',
      category: 'medical',
      title: 'Possible leg length difference',
      detail:
        'Possible leg length difference detected — podiatry or physio assessment advised.',
    })
  }

  if (metrics.scissorGaitDetected) {
    recs.push({
      severity: 'concern',
      category: 'medical',
      title: 'Scissor gait pattern',
      detail:
        'Scissor pattern detected — neurological or hip assessment recommended.',
    })
  }

  if (recs.length === 0) {
    recs.push({
      severity: 'info',
      category: 'strengthening',
      title: 'Great gait pattern!',
      detail:
        'Great gait pattern! To maintain it, keep up regular foot strengthening and mobility work.',
    })
  }

  return recs
}

// ── Build step timeline ─────────────────────────────────────
export function buildStepTimeline(frames: TaggedFrame[]): StepTimelineEntry[] {
  if (frames.length === 0) return []

  const startTime = frames[0].timestamp
  const leftSteps = detectStepEvents(frames, 'left')
  const rightSteps = detectStepEvents(frames, 'right')

  return frames
    .filter((_, i) => i % 3 === 0) // downsample for performance
    .map((frame) => {
      const t = (frame.timestamp - startTime) / 1000
      const lHeel = frame.landmarks[LM.LEFT_HEEL]
      const rHeel = frame.landmarks[LM.RIGHT_HEEL]

      const isLeftStrike = leftSteps.some(
        (s) => Math.abs(s.strikeTimestamp - frame.timestamp) < 100
      )
      const isRightStrike = rightSteps.some(
        (s) => Math.abs(s.strikeTimestamp - frame.timestamp) < 100
      )

      return {
        timestamp: parseFloat(t.toFixed(2)),
        leftHeelY: lHeel ? parseFloat((1 - lHeel.y).toFixed(3)) : 0,
        rightHeelY: rHeel ? parseFloat((1 - rHeel.y).toFixed(3)) : 0,
        leftStrike: isLeftStrike || undefined,
        rightStrike: isRightStrike || undefined,
      }
    })
}

// Helper to get ankle drop value from frames
export function getAnkleDrop(frames: TaggedFrame[], side: GaitSide): number {
  const sideFrames = frames.filter(
    (f) => f.pass === 'left_side' || f.pass === 'right_side'
  )
  const ankleIdx = side === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE
  const heelIdx = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL
  const toeIdx = side === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX

  const drops: number[] = []
  for (const frame of sideFrames) {
    const ankle = getLandmark(frame.landmarks, ankleIdx)
    const heel = getLandmark(frame.landmarks, heelIdx)
    const toe = getLandmark(frame.landmarks, toeIdx)
    if (!ankle || !heel || !toe) continue
    const midY = (heel.y + toe.y) / 2
    drops.push(ankle.y - midY)
  }
  if (drops.length === 0) return 0
  return drops.reduce((a, b) => a + b, 0) / drops.length
}
