import { useRef, useState, useCallback } from 'react'
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

const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'
const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'

interface MediaPipeVisionModule {
  PoseLandmarker: {
    createFromOptions(vision: unknown, opts: unknown): Promise<PoseLandmarkerInstance>
  }
  FilesetResolver: {
    forVisionTasks(path: string): Promise<unknown>
  }
}

interface PoseLandmarkerInstance {
  detectForVideo(
    video: HTMLVideoElement,
    timestamp: number
  ): {
    landmarks: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>
    worldLandmarks?: Array<Array<{ x: number; y: number; z: number }>>
  }
  close(): void
}

let visionModulePromise: Promise<MediaPipeVisionModule> | null = null

function loadVisionModule(): Promise<MediaPipeVisionModule> {
  if (!visionModulePromise) {
    visionModulePromise = import(/* @vite-ignore */ VISION_CDN) as Promise<MediaPipeVisionModule>
  }
  return visionModulePromise
}

export function usePoseDetection() {
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initPoseDetector = useCallback(async () => {
    try {
      setError(null)
      const vision = await loadVisionModule()
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH)
      const poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
        outputSegmentationMasks: false,
      })
      landmarkerRef.current = poseLandmarker
      setIsLoaded(true)
    } catch {
      // Try CPU fallback
      try {
        const vision = await loadVisionModule()
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH)
        const poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
          outputSegmentationMasks: false,
        })
        landmarkerRef.current = poseLandmarker
        setIsLoaded(true)
      } catch (cpuErr) {
        const msg =
          cpuErr instanceof Error ? cpuErr.message : 'Unknown error loading model'
        setError(
          `Could not load pose detection model. Please check your connection and refresh. (${msg})`
        )
      }
    }
  }, [])

  const detectPose = useCallback(
    (videoEl: HTMLVideoElement, timestamp: number): Landmark3D[] | null => {
      if (!landmarkerRef.current || !isLoaded) return null
      try {
        const result = landmarkerRef.current.detectForVideo(videoEl, timestamp)
        if (!result.landmarks || result.landmarks.length === 0) return null
        const raw = result.landmarks[0]
        const worldLandmarks = result.worldLandmarks?.[0]

        return raw.map((lm: { x: number; y: number; z?: number; visibility?: number }, i: number) => ({
          x: lm.x,
          y: lm.y,
          z: worldLandmarks?.[i]?.z ?? lm.z ?? 0,
          visibility: lm.visibility ?? 1,
        }))
      } catch {
        return null
      }
    },
    [isLoaded]
  )

  return { initPoseDetector, detectPose, isLoaded, error }
}
