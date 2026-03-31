import { useCallback, useRef } from 'react'
import { useGaitStore } from '../store/gaitStore'
import { usePoseDetection } from './usePoseDetection'
import { usePassDetection } from './usePassDetection'
import { useSpeechCues, SPEECH_CUES } from './useSpeechCues'
import { smoothFrames } from '../utils/smoothing'
import {
  detectStepEvents,
  calculateCadence,
  calculateSymmetry,
  detectArchFromFrames,
  calculateToeAngle,
  calculateDorsiflexion,
  detectHipDrop,
  detectHeelWhip,
  detectScissorGait,
  detectOverpronation,
  detectLegLengthDiscrepancy,
  calculateGaitScore,
  generateRecommendations,
  buildStepTimeline,
  getAnkleDrop,
} from '../utils/gaitCalculations'
import type {
  GaitMetrics,
  GaitReport,
  WalkPass,
  PassData,
  TaggedFrame,
} from '../types/gait.types'

const MAX_RECORDING_SECONDS = 90
const ALL_PASSES: WalkPass[] = ['front', 'rear', 'left_side', 'right_side']

export function useGaitAnalysis() {
  const store = useGaitStore()
  const { detectPose } = usePoseDetection()
  const { processFrame } = usePassDetection()
  const { speak } = useSpeechCues()

  const animFrameRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastPassRef = useRef<WalkPass>('unknown')
  const lapCountRef = useRef(0)
  const passCompletedRef = useRef<Set<WalkPass>>(new Set())

  const stopAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    store.setRecording(false)
    buildAndSetReport()
    store.setScreen('report')
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildAndSetReport = useCallback(() => {
    const frames = store.frames
    if (frames.length === 0) return

    const rawLandmarks = frames.map((f) => f.landmarks)
    const smoothed = smoothFrames(rawLandmarks, 5)
    const smoothedFrames: TaggedFrame[] = frames.map((f, i) => ({
      ...f,
      landmarks: smoothed[i] ?? f.landmarks,
    }))

    const leftSteps = detectStepEvents(smoothedFrames, 'left')
    const rightSteps = detectStepEvents(smoothedFrames, 'right')
    const allSteps = [...leftSteps, ...rightSteps]

    const leftArch = detectArchFromFrames(smoothedFrames, 'left')
    const rightArch = detectArchFromFrames(smoothedFrames, 'right')

    const leftAnkleDrop = getAnkleDrop(smoothedFrames, 'left')
    const rightAnkleDrop = getAnkleDrop(smoothedFrames, 'right')

    const leftStrike = leftSteps[0]?.strikePattern ?? 'heel'
    const rightStrike = rightSteps[0]?.strikePattern ?? 'heel'

    const metrics: GaitMetrics = {
      cadence: calculateCadence(allSteps),
      symmetryScore: calculateSymmetry(leftSteps, rightSteps),
      leftArch,
      rightArch,
      leftStrikePattern: leftStrike,
      rightStrikePattern: rightStrike,
      leftToeAngle: calculateToeAngle(smoothedFrames, 'left'),
      rightToeAngle: calculateToeAngle(smoothedFrames, 'right'),
      stepCount: allSteps.length,
      analysisDuration:
        frames.length > 1
          ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000
          : 0,
      stepWidth: 25, // estimated default in cm
      leftAnkleDorsiflexion: calculateDorsiflexion(smoothedFrames, 'left'),
      rightAnkleDorsiflexion: calculateDorsiflexion(smoothedFrames, 'right'),
      hipDropDetected: detectHipDrop(smoothedFrames),
      heelWhipDetected: detectHeelWhip(smoothedFrames),
      scissorGaitDetected: detectScissorGait(smoothedFrames),
      overpronationLeft: detectOverpronation(leftArch, leftAnkleDrop, leftStrike),
      overpronationRight: detectOverpronation(rightArch, rightAnkleDrop, rightStrike),
      legLengthDiscrepancy: detectLegLengthDiscrepancy(smoothedFrames),
    }

    const passDataRecord: Record<WalkPass, PassData | null> = {
      front: null,
      rear: null,
      left_side: null,
      right_side: null,
      unknown: null,
    }

    for (const pass of ALL_PASSES) {
      const pFrames = smoothedFrames.filter((f) => f.pass === pass)
      const strideCount = store.passProgress[pass]
      const quality =
        strideCount >= 3 ? 'good' : strideCount >= 1 ? 'fair' : 'poor'
      passDataRecord[pass] = {
        pass,
        frames: pFrames,
        strideCount,
        quality,
        complete: strideCount >= 3,
      }
    }

    const completedPasses = ALL_PASSES.filter(
      (p) => store.passProgress[p] >= 1
    ).length

    const report: GaitReport = {
      metrics,
      overallScore: calculateGaitScore(metrics),
      recommendations: generateRecommendations(metrics),
      stepTimeline: buildStepTimeline(smoothedFrames),
      passData: passDataRecord,
      timestamp: new Date(),
      passesCompleted: completedPasses,
    }

    store.setReport(report)
  }, [store])

  const loop = useCallback(
    (video: HTMLVideoElement) => {
      const run = () => {
        if (!store.isRecording) return

        const now = performance.now()
        const landmarks = detectPose(video, now)

        if (landmarks) {
          const currentPass = store.currentPass
          const frame: TaggedFrame = {
            landmarks,
            timestamp: now,
            pass: currentPass,
            passConfidence: 1,
          }
          store.addFrame(frame)

          // Pass detection on last 20 frames
          const recentFrames = store.frames.slice(-20).concat([frame])
          const { pass } = processFrame(recentFrames)

          // Speech cues on pass change
          if (pass !== 'unknown' && pass !== lastPassRef.current) {
            const previousPass = lastPassRef.current
            lastPassRef.current = pass

            if (previousPass === 'unknown') {
              // first detected pass
            } else {
              // Check for second lap
              if (passCompletedRef.current.size === 4) {
                lapCountRef.current++
                if (lapCountRef.current === 1) {
                  speak(SPEECH_CUES.SECOND_LAP, true)
                }
              }
            }

            if (pass === 'rear') speak(SPEECH_CUES.REAR)
            else if (pass === 'right_side') speak(SPEECH_CUES.RIGHT_SIDE)
            else if (pass === 'front') speak(SPEECH_CUES.FRONT)
            else if (pass === 'left_side') speak(SPEECH_CUES.LEFT_SIDE)
          }

          // Track pass completions for speech cues
          if (store.passProgress[store.currentPass] >= 3) {
            if (!passCompletedRef.current.has(store.currentPass)) {
              passCompletedRef.current.add(store.currentPass)
              speak(SPEECH_CUES.PASS_DONE)
            }
          }

          // Auto-stop when all passes complete
          if (store.allPassesComplete()) {
            speak(SPEECH_CUES.COMPLETE, true)
            stopAnalysis()
            return
          }
        }

        // Timeout check
        if (store.recordingStartTime) {
          const elapsed = (Date.now() - store.recordingStartTime) / 1000
          if (elapsed >= MAX_RECORDING_SECONDS) {
            speak(SPEECH_CUES.TIMEOUT, true)
            stopAnalysis()
            return
          }
        }

        animFrameRef.current = requestAnimationFrame(run)
      }

      animFrameRef.current = requestAnimationFrame(run)
    },
    [store, detectPose, processFrame, speak, stopAnalysis]
  )

  const startRecording = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video
      lastPassRef.current = 'unknown'
      lapCountRef.current = 0
      passCompletedRef.current = new Set()
      store.setRecording(true)
      speak(SPEECH_CUES.START, true)
      loop(video)
    },
    [store, speak, loop]
  )

  const stopRecording = useCallback(() => {
    stopAnalysis()
  }, [stopAnalysis])

  return { startRecording, stopRecording, isRecording: store.isRecording }
}
