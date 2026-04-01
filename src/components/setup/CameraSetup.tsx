import { useEffect, useRef, useState } from 'react'
import { useGaitStore } from '../../store/gaitStore'
import { usePoseDetection } from '../../hooks/usePoseDetection'
import { LM } from '../../utils/landmarkHelpers'

interface CheckItem {
  label: string
  status: 'pending' | 'ok' | 'fail'
}

export default function CameraSetup() {
  const setScreen = useGaitStore((s) => s.setScreen)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { initPoseDetector, detectPose, isLoaded, error: poseError } = usePoseDetection()

  const [camError, setCamError] = useState<string | null>(null)
  const [checks, setChecks] = useState<CheckItem[]>([
    { label: 'Camera detected', status: 'pending' },
    { label: 'Enough light', status: 'pending' },
    { label: 'Full body visible', status: 'pending' },
    { label: 'Floor visible', status: 'pending' },
  ])

  const allOk = checks.every((c) => c.status === 'ok')

  const updateCheck = (label: string, status: CheckItem['status']) => {
    setChecks((prev) =>
      prev.map((c) => (c.label === label ? { ...c, status } : c))
    )
  }

  useEffect(() => {
    initPoseDetector()
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    try {
      // Get permission first so device labels become available
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      temp.getTracks().forEach((t) => t.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')

      const rearCamera =
        videoDevices.find((d) => {
          const l = d.label.toLowerCase()
          return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back')
        }) ?? videoDevices[0]

      const stream = await navigator.mediaDevices.getUserMedia({
        video: rearCamera?.deviceId
          ? { deviceId: { exact: rearCamera.deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'environment', width: 640, height: 480 },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        updateCheck('Camera detected', 'ok')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied'
      setCamError(msg)
      updateCheck('Camera detected', 'fail')
    }
  }

  // Run light + body checks every 500ms once camera is ready
  useEffect(() => {
    if (!isLoaded) return
    const interval = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Light check
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let brightness = 0
      for (let i = 0; i < data.length; i += 16) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
      }
      brightness /= data.length / 16
      updateCheck('Enough light', brightness > 60 ? 'ok' : 'fail')

      // Pose checks
      const landmarks = detectPose(video, performance.now())
      if (landmarks) {
        const lHip = landmarks[LM.LEFT_HIP]
        const rHip = landmarks[LM.RIGHT_HIP]
        const lAnkle = landmarks[LM.LEFT_ANKLE]
        const rAnkle = landmarks[LM.RIGHT_ANKLE]

        const bodyVisible =
          (lHip?.visibility ?? 0) > 0.5 &&
          (rHip?.visibility ?? 0) > 0.5 &&
          ((lAnkle?.visibility ?? 0) > 0.5 || (rAnkle?.visibility ?? 0) > 0.5)

        updateCheck('Full body visible', bodyVisible ? 'ok' : 'fail')

        const lHeel = landmarks[LM.LEFT_HEEL]
        const rHeel = landmarks[LM.RIGHT_HEEL]
        const heelVisible =
          (lHeel?.y ?? 0) > 0.7 || (rHeel?.y ?? 0) > 0.7
        updateCheck('Floor visible', heelVisible ? 'ok' : 'fail')
      } else {
        updateCheck('Full body visible', 'fail')
        updateCheck('Floor visible', 'fail')
      }
    }, 600)
    return () => clearInterval(interval)
  }, [isLoaded, detectPose])

  const statusIcon = (status: CheckItem['status']) =>
    status === 'ok' ? '✓' : status === 'fail' ? '✗' : '…'
  const statusColor = (status: CheckItem['status']) =>
    status === 'ok'
      ? 'text-green-400'
      : status === 'fail'
      ? 'text-red-400'
      : 'text-gray-500'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Camera Setup</h2>
      <p className="text-gray-400 mb-6">Position your camera and make sure everything checks out.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera preview */}
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border border-gray-800">
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl mb-2">📷</span>
              <p className="text-red-400 font-semibold mb-1">Camera Access Denied</p>
              <p className="text-gray-500 text-sm">{camError}</p>
              <div className="mt-4 text-xs text-gray-600 space-y-1">
                <p>Chrome: Click the lock icon → Allow Camera</p>
                <p>Firefox: Click the shield icon → Allow</p>
                <p>Safari: Preferences → Websites → Camera</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          {!isLoaded && !poseError && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded px-3 py-1 text-xs text-blue-300 text-center">
              Loading pose model…
            </div>
          )}
          {poseError && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-900/80 rounded px-3 py-1 text-xs text-red-200 text-center">
              {poseError}
            </div>
          )}
        </div>

        {/* Checks + tips */}
        <div className="space-y-4">
          {/* Status checks */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-3">
                <span className={`font-mono font-bold text-lg w-6 text-center ${statusColor(check.status)}`}>
                  {statusIcon(check.status)}
                </span>
                <span className={`text-sm ${check.status === 'ok' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          {/* Placement tips */}
          <div className="space-y-2">
            {[
              { icon: '🪑', tip: 'Place camera at knee height on a chair or stack of books' },
              { icon: '📏', tip: 'Stand 3–4 meters away from camera' },
              { icon: '🚶', tip: 'Ensure 3×3m of clear walking space behind you' },
              { icon: '🦶', tip: 'Remove shoes for best arch detection' },
            ].map(({ icon, tip }) => (
              <div key={tip} className="flex gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
                <span className="text-lg">{icon}</span>
                <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setScreen('protocol')}
          disabled={!allOk}
          className={`px-8 py-3 rounded-xl font-bold text-base transition-colors ${
            allOk
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {allOk ? 'Looks good — Continue' : 'Waiting for all checks…'}
        </button>
      </div>
    </div>
  )
}
