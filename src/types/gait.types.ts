// ── Enums ──────────────────────────────────────────────
export type ArchType = 'flat' | 'neutral' | 'high'
export type StrikePattern = 'heel' | 'midfoot' | 'forefoot'
export type GaitSide = 'left' | 'right'
export type WalkPass = 'front' | 'rear' | 'left_side' | 'right_side' | 'unknown'
export type AppScreen = 'welcome' | 'camera_setup' | 'protocol' | 'recording' | 'report'

// ── Landmarks ──────────────────────────────────────────
export interface Landmark2D {
  x: number   // normalized 0-1
  y: number
  visibility?: number
}

export interface Landmark3D extends Landmark2D {
  z: number   // depth
}

export interface FootLandmarks {
  heel: Landmark3D
  ankle: Landmark3D
  toeIndex: Landmark3D
  knee: Landmark3D
  hip: Landmark3D
}

// ── Frame Data ─────────────────────────────────────────
export interface TaggedFrame {
  landmarks: Landmark3D[]
  timestamp: number
  pass: WalkPass
  passConfidence: number
}

// ── Step Events ────────────────────────────────────────
export interface StepEvent {
  side: GaitSide
  strikeTimestamp: number
  toeOffTimestamp: number
  duration: number
  strikePattern: StrikePattern
  pass: WalkPass
}

export interface StepTimelineEntry {
  timestamp: number
  leftHeelY: number
  rightHeelY: number
  leftStrike?: boolean
  rightStrike?: boolean
}

// ── Pass Tracking ──────────────────────────────────────
export interface PassData {
  pass: WalkPass
  frames: TaggedFrame[]
  strideCount: number
  quality: 'poor' | 'fair' | 'good'
  complete: boolean
}

// ── Metrics ────────────────────────────────────────────
export interface GaitMetrics {
  cadence: number                    // steps/min
  symmetryScore: number              // 0-100
  leftArch: ArchType
  rightArch: ArchType
  leftStrikePattern: StrikePattern
  rightStrikePattern: StrikePattern
  leftToeAngle: number               // degrees, + = toe-out
  rightToeAngle: number
  stepCount: number
  analysisDuration: number           // seconds
  stepWidth: number                  // cm estimated
  leftAnkleDorsiflexion: number      // degrees
  rightAnkleDorsiflexion: number
  hipDropDetected: boolean
  heelWhipDetected: boolean
  scissorGaitDetected: boolean
  overpronationLeft: boolean
  overpronationRight: boolean
  legLengthDiscrepancy: boolean
}

// ── Report ─────────────────────────────────────────────
export interface GaitReport {
  metrics: GaitMetrics
  overallScore: number               // 0-100
  recommendations: Recommendation[]
  stepTimeline: StepTimelineEntry[]
  passData: Record<WalkPass, PassData | null>
  timestamp: Date
  passesCompleted: number
}

export interface Recommendation {
  severity: 'info' | 'warning' | 'concern'
  category: 'footwear' | 'strengthening' | 'stretching' | 'medical'
  title: string
  detail: string
}
