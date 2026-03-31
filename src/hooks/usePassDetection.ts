import { useCallback, useRef } from 'react'
import { useGaitStore } from '../store/gaitStore'
import { detectPass, countStridesInPass } from '../utils/passDetection'
import type { TaggedFrame, WalkPass } from '../types/gait.types'

const PASS_STABILITY_FRAMES = 5
const CONFIDENCE_THRESHOLD = 0.65

export function usePassDetection() {
  const { setCurrentPass, updatePassProgress, currentPass } = useGaitStore()
  const stabilityBuffer = useRef<WalkPass[]>([])
  const committedPass = useRef<WalkPass>('unknown')

  const processFrame = useCallback(
    (recentFrames: TaggedFrame[]) => {
      const { pass, confidence } = detectPass(recentFrames)

      if (confidence > CONFIDENCE_THRESHOLD && pass !== 'unknown') {
        stabilityBuffer.current.push(pass)
        if (stabilityBuffer.current.length > 10) {
          stabilityBuffer.current.shift()
        }

        const recent = stabilityBuffer.current.slice(-PASS_STABILITY_FRAMES)
        const allSame = recent.length >= PASS_STABILITY_FRAMES && recent.every((p) => p === pass)

        if (allSame && committedPass.current !== pass) {
          committedPass.current = pass
          setCurrentPass(pass)
        }
      }

      // Update stride count for current pass
      const activePass = committedPass.current !== 'unknown' ? committedPass.current : currentPass
      if (activePass !== 'unknown' && recentFrames.length > 10) {
        const passFrames = recentFrames.filter((f) => f.pass === activePass)
        if (passFrames.length > 5) {
          const leftStrides = countStridesInPass(passFrames, 'left')
          const rightStrides = countStridesInPass(passFrames, 'right')
          const strides = Math.min(leftStrides, rightStrides) + 1
          updatePassProgress(activePass, strides)
        }
      }

      return { pass, confidence }
    },
    [setCurrentPass, updatePassProgress, currentPass]
  )

  return { processFrame }
}
