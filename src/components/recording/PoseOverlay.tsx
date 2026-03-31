import { useEffect, useRef } from 'react'
import type { Landmark3D, WalkPass } from '../../types/gait.types'
import { LM } from '../../utils/landmarkHelpers'

interface PoseOverlayProps {
  landmarks: Landmark3D[] | null
  width: number
  height: number
  currentPass: WalkPass
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void
}

const SKELETON_CONNECTIONS = [
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
  [LM.LEFT_HIP, 11], // shoulder approximation
  [LM.RIGHT_HIP, 12],
]

const PASS_LABELS: Record<WalkPass, string> = {
  front: '📹 Front — Toe angle',
  rear: '📹 Rear — Heel lift',
  left_side: '📹 Left Side — Arch',
  right_side: '📹 Right Side — Arch',
  unknown: '📹 Detecting direction…',
}

export default function PoseOverlay({ landmarks, width, height, currentPass, onCanvasRef }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    onCanvasRef?.(canvasRef.current)
  }, [onCanvasRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    if (!landmarks || landmarks.length === 0) return

    const x = (lm: Landmark3D) => lm.x * width
    const y = (lm: Landmark3D) => lm.y * height

    // Draw skeleton
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)'
    ctx.lineWidth = 2
    for (const [a, b] of SKELETON_CONNECTIONS) {
      const lmA = landmarks[a]
      const lmB = landmarks[b]
      if (!lmA || !lmB) continue
      if ((lmA.visibility ?? 1) < 0.3 || (lmB.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.moveTo(x(lmA), y(lmA))
      ctx.lineTo(x(lmB), y(lmB))
      ctx.stroke()
    }

    // All landmarks as small white dots
    for (const lm of landmarks) {
      if ((lm.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.arc(x(lm), y(lm), 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()
    }

    // Left foot landmarks — GREEN
    const leftFootIdxs = [LM.LEFT_HEEL, LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX]
    for (const idx of leftFootIdxs) {
      const lm = landmarks[idx]
      if (!lm || (lm.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.arc(x(lm), y(lm), 7, 0, Math.PI * 2)
      ctx.fillStyle = '#22c55e'
      ctx.fill()
    }

    // Right foot landmarks — BLUE
    const rightFootIdxs = [LM.RIGHT_HEEL, LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX]
    for (const idx of rightFootIdxs) {
      const lm = landmarks[idx]
      if (!lm || (lm.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.arc(x(lm), y(lm), 7, 0, Math.PI * 2)
      ctx.fillStyle = '#3b82f6'
      ctx.fill()
    }

    // Direction arrows HEEL → TOE
    const drawFootArrow = (heelIdx: number, toeIdx: number, color: string) => {
      const heel = landmarks[heelIdx]
      const toe = landmarks[toeIdx]
      if (!heel || !toe) return
      if ((heel.visibility ?? 1) < 0.3 || (toe.visibility ?? 1) < 0.3) return

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x(heel), y(heel))
      ctx.lineTo(x(toe), y(toe))
      ctx.stroke()

      // Arrow head
      const angle = Math.atan2(y(toe) - y(heel), x(toe) - x(heel))
      ctx.beginPath()
      ctx.moveTo(x(toe), y(toe))
      ctx.lineTo(x(toe) - 10 * Math.cos(angle - 0.4), y(toe) - 10 * Math.sin(angle - 0.4))
      ctx.moveTo(x(toe), y(toe))
      ctx.lineTo(x(toe) - 10 * Math.cos(angle + 0.4), y(toe) - 10 * Math.sin(angle + 0.4))
      ctx.stroke()
    }

    drawFootArrow(LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX, '#4ade80')
    drawFootArrow(LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX, '#60a5fa')

    // Pass label
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(8, 8, 220, 28)
    ctx.fillStyle = '#e5e7eb'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText(PASS_LABELS[currentPass], 14, 27)
  }, [landmarks, width, height, currentPass])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
    />
  )
}
