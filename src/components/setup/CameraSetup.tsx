import { useEffect, useRef, useState } from 'react'
import { useGaitStore } from '../../store/gaitStore'
import { usePoseDetection } from '../../hooks/usePoseDetection'
import { LM } from '../../utils/landmarkHelpers'

interface CheckItem {
  label: string
  status: 'pending' | 'ok' | 'fail'
}

const isFrontLabel = (label: string) => {
  const l = label.toLowerCase()
  return l.includes('front') || l.includes('user') || l.includes('facetime') || l.includes('facing front')
}
const isBackLabel = (label: string) => {
  const l = label.toLowerCase()
  return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back')
}

export default function CameraSetup() {
  const setScreen = useGaitStore((s) => s.setScreen)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { initPoseDetector, detectPose, isLoaded, error: poseError } = usePoseDetection()

  const [camError, setCamError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [checks, setChecks] = useState<CheckItem[]>([
    { label: 'Camera detected', status: 'pending' },
    { label: 'Enough light', status: 'pending' },
    { label: 'Full body visible', status: 'pending' },
    { label: 'Floor visible', status: 'pending' },
  ])

  const allOk = checks.every((c) => c.status === 'ok')

  const updateCheck = (label: string, status: CheckItem['status']) => {
    setChecks((prev) => prev.map((c) => (c.label === label ? { ...c, status } : c)))
  }

  useEffect(() => {
    initPoseDetector()
    startCamera('environment')
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async (mode: 'environment' | 'user') => {
    setCamError(null)
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())

      // Request permission first so device labels populate
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      temp.getTracks().forEach((t) => t.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')

      const chosen =
        mode === 'user'
          ? (videoDevices.find((d) => isFrontLabel(d.label)) ?? videoDevices[0])
          : (videoDevices.find((d) => isBackLabel(d.label)) ?? videoDevices[videoDevices.length - 1])

      const stream = await navigator.mediaDevices.getUserMedia({
        video: chosen?.deviceId
          ? { deviceId: { exact: chosen.deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: mode, width: 640, height: 480 },
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

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  // Run light + body checks every 600ms once pose model is ready
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

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let brightness = 0
      for (let i = 0; i < data.length; i += 16) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
      }
      brightness /= data.length / 16
      updateCheck('Enough light', brightness > 60 ? 'ok' : 'fail')

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
        updateCheck('Floor visible', (lHeel?.y ?? 0) > 0.7 || (rHeel?.y ?? 0) > 0.7 ? 'ok' : 'fail')
      } else {
        updateCheck('Full body visible', 'fail')
        updateCheck('Floor visible', 'fail')
      }
    }, 600)
    return () => clearInterval(interval)
  }, [isLoaded, detectPose])

  const StatusIcon = ({ status }: { status: CheckItem['status'] }) => {
    if (status === 'ok') {
      return (
        <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        </div>
      )
    }
    if (status === 'fail') {
      return (
        <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="3" x2="9" y2="9" />
            <line x1="9" y1="3" x2="3" y2="9" />
          </svg>
        </div>
      )
    }
    return (
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-gray-400 animate-spin" />
      </div>
    )
  }

  const TIPS = [
    {
      tip: 'Place phone at knee height on a chair or stack of books',
      icon: (
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="10" rx="1" />
          <path d="M8 13v4" /><path d="M16 13v4" />
          <line x1="3" y1="17" x2="21" y2="17" />
          <line x1="3" y1="21" x2="21" y2="21" />
        </svg>
      ),
    },
    {
      tip: 'Stand 3–4 meters away from the phone',
      icon: (
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <polyline points="3,9 3,15" />
          <polyline points="21,9 21,15" />
        </svg>
      ),
    },
    {
      tip: 'Ensure 3×3m of clear walking space behind you',
      icon: (
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v5l-3 5" />
          <path d="M12 12l3 5" />
        </svg>
      ),
    },
    {
      tip: 'Remove shoes for best arch detection',
      icon: (
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 16 Q8 10 14 12 Q18 14 20 16 L20 18 Q14 20 4 18 Z" />
          <path d="M14 12 L16 6" />
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Camera Setup</h2>
      <p className="text-gray-400 mb-6">Position your camera and make sure everything checks out.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera preview */}
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border border-gray-800">
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <svg className="w-10 h-10 text-gray-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3.5L14 4h-4L7.5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <p className="text-red-400 font-semibold mb-1">Camera Access Denied</p>
              <p className="text-gray-500 text-sm">{camError}</p>
              <div className="mt-4 text-xs text-gray-600 space-y-1">
                <p>Chrome: tap the lock icon → Allow Camera</p>
                <p>Safari: Settings → Safari → Camera → Allow</p>
              </div>
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Camera flip button */}
          {!camError && (
            <button
              onClick={switchCamera}
              title={`Switch to ${facingMode === 'environment' ? 'front' : 'rear'} camera`}
              className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 border border-white/20 text-white rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3.5L14 4h-4L7.5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="13" r="3"/>
                <path d="m15 13-2-2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-3">
                <StatusIcon status={check.status} />
                <span className={`text-sm ${check.status === 'ok' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {TIPS.map(({ icon, tip }) => (
              <div key={tip} className="flex gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
                {icon}
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
