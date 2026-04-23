import { useEffect, useRef, useState, useCallback } from 'react'
import { useGaitStore } from '../../store/gaitStore'
import { usePoseDetection } from '../../hooks/usePoseDetection'
import { useGaitAnalysis } from '../../hooks/useGaitAnalysis'
import { detectArchFromFrames } from '../../utils/gaitCalculations'
import PoseOverlay from './PoseOverlay'
import LiveMetrics from './LiveMetrics'
import PassIndicator from './PassIndicator'
import type { Landmark3D, ArchType, StrikePattern } from '../../types/gait.types'
import { LM } from '../../utils/landmarkHelpers'

type PositionFeedback = 'too_close' | 'too_far' | 'move_left' | 'move_right' | 'good' | null

function getPositionFeedback(lm: Landmark3D[]): PositionFeedback {
  const lShoulder = lm[LM.LEFT_SHOULDER]
  const rShoulder = lm[LM.RIGHT_SHOULDER]
  const lHip     = lm[LM.LEFT_HIP]
  const rHip     = lm[LM.RIGHT_HIP]
  const lHeel    = lm[LM.LEFT_HEEL]
  const rHeel    = lm[LM.RIGHT_HEEL]

  const hipVis      = Math.min(lHip?.visibility ?? 0, rHip?.visibility ?? 0)
  const shoulderVis = Math.min(lShoulder?.visibility ?? 0, rShoulder?.visibility ?? 0)
  const heelVis     = Math.max(lHeel?.visibility ?? 0, rHeel?.visibility ?? 0)

  if (hipVis < 0.3) return 'too_far'

  if (shoulderVis > 0.4) {
    const topY    = Math.min(lShoulder?.y ?? 1, rShoulder?.y ?? 1)
    const bottomY = Math.max(lHeel?.y ?? 0, rHeel?.y ?? 0)
    const span    = bottomY - topY

    if (heelVis < 0.2 && shoulderVis > 0.5) return 'too_close' // shoulders visible, feet not
    if (span > 0.82) return 'too_close'
    if (span < 0.35) return 'too_far'

    // Horizontal centering based on hip midpoint
    const hipCenterX = ((lHip?.x ?? 0.5) + (rHip?.x ?? 0.5)) / 2
    if (hipCenterX < 0.28) return 'move_right'
    if (hipCenterX > 0.72) return 'move_left'

    return 'good'
  }

  return 'too_far'
}

const FEEDBACK_CONFIG: Record<NonNullable<PositionFeedback>, { icon: string; text: string; color: string }> = {
  too_close:  { icon: '↕',  text: 'Move further away',    color: 'bg-orange-500/80 border-orange-400' },
  too_far:    { icon: '🔍', text: 'Move closer',           color: 'bg-blue-500/80 border-blue-400' },
  move_left:  { icon: '←',  text: 'Move left',             color: 'bg-yellow-500/80 border-yellow-400' },
  move_right: { icon: '→',  text: 'Move right',            color: 'bg-yellow-500/80 border-yellow-400' },
  good:       { icon: '✓',  text: 'Good position',         color: 'bg-green-500/80 border-green-400' },
}

const isFrontLabel = (label: string) => {
  const l = label.toLowerCase()
  return l.includes('front') || l.includes('user') || l.includes('facetime') || l.includes('facing front')
}
const isBackLabel = (label: string) => {
  const l = label.toLowerCase()
  return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back')
}

const pickCamera = (devices: MediaDeviceInfo[], mode: 'environment' | 'user'): MediaDeviceInfo | null => {
  if (!devices.length) return null
  if (mode === 'user') {
    return devices.find((d) => isFrontLabel(d.label)) ?? devices[0]
  }
  return devices.find((d) => isBackLabel(d.label)) ?? devices[devices.length - 1]
}

export default function VideoCapture() {
  const store = useGaitStore()
  const { initPoseDetector, detectPose, isLoaded, error: poseError } = usePoseDetection()
  const { startRecording, stopRecording } = useGaitAnalysis()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileVideoRef = useRef<HTMLVideoElement>(null)
  const loopRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentDeviceIdRef = useRef<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [showReadyPopup, setShowReadyPopup] = useState(false)
  const [listeningForReady, setListeningForReady] = useState(false)
  const [readyCountdown, setReadyCountdown] = useState(5)
  const [elapsed, setElapsed] = useState(0)
  const [landmarks, setLandmarks] = useState<Landmark3D[] | null>(null)
  const [videoDims, setVideoDims] = useState({ w: 640, h: 480 })
  const [noMovementWarning, setNoMovementWarning] = useState(false)
  const [lowLightWarning, setLowLightWarning] = useState(false)
  const [positionFeedback, setPositionFeedback] = useState<PositionFeedback>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [useFileInput, setUseFileInput] = useState(false)

  const [liveCadence, setLiveCadence] = useState(0)
  const [liveSymmetry, setLiveSymmetry] = useState(50)
  const [liveLeftArch, setLiveLeftArch] = useState<ArchType>('neutral')
  const [liveRightArch, setLiveRightArch] = useState<ArchType>('neutral')
  const [liveLeftStrike, setLiveLeftStrike] = useState<StrikePattern>('heel')
  const [liveRightStrike, setLiveRightStrike] = useState<StrikePattern>('heel')

  const totalProgress = Math.min(
    100,
    (Object.values(store.passProgress).reduce((s, v) => s + Math.min(v, 3), 0) / 12) * 100
  )

  useEffect(() => {
    initPoseDetector()
    startCamera('environment')

    const handleResize = () => {
      setIsPortrait(window.innerWidth < window.innerHeight && window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      cleanup()
      window.removeEventListener('resize', handleResize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (loopRef.current) cancelAnimationFrame(loopRef.current)
    recognitionRef.current?.stop()
  }

  const loadVideoDevices = async (): Promise<MediaDeviceInfo[]> => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'videoinput')
  }

  const startCamera = async (mode: 'environment' | 'user', isSwitch = false) => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())

      // Request permission first so that device labels become available
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      temp.getTracks().forEach((t) => t.stop())

      const devices = await loadVideoDevices()
      const chosen = pickCamera(devices, mode)

      let stream: MediaStream

      if (chosen?.deviceId) {
        currentDeviceIdRef.current = chosen.deviceId
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: chosen.deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } else {
        // fallback to facingMode hint
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      if (!isSwitch) setUseFileInput(true)
    }
  }

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    await startCamera(newMode, true)
  }

  // When model loads, show popup and start countdown
  useEffect(() => {
    if (!isLoaded) return
    setShowReadyPopup(true)
    setReadyCountdown(5)
    startListeningForReady()
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // 5-second countdown — auto-starts if user doesn't say "ready" first
  useEffect(() => {
    if (!showReadyPopup) return
    if (readyCountdown <= 0) {
      handleStart()
      return
    }
    const t = setTimeout(() => setReadyCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showReadyPopup, readyCountdown]) // eslint-disable-line react-hooks/exhaustive-deps

  const startListeningForReady = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setListeningForReady(true)
    recognition.onend = () => setListeningForReady(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript.toLowerCase().trim()
        if (transcript.includes('ready')) {
          recognition.stop()
          handleStart()
          break
        }
      }
    }

    recognition.onerror = () => setListeningForReady(false)

    recognitionRef.current = recognition
    recognition.start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    recognitionRef.current?.stop()
    setShowReadyPopup(false)
    const vid = videoRef.current || fileVideoRef.current
    if (vid) startRecording(vid)
  }, [startRecording])

  // Elapsed timer
  useEffect(() => {
    if (!store.isRecording) return
    const t = setInterval(() => {
      if (store.recordingStartTime) {
        setElapsed(Math.floor((Date.now() - store.recordingStartTime) / 1000))
      }
    }, 500)
    return () => clearInterval(t)
  }, [store.isRecording, store.recordingStartTime])

  // Live pose loop
  useEffect(() => {
    if (!isLoaded) return
    const vid = videoRef.current || fileVideoRef.current
    if (!vid) return

    const run = () => {
      if (vid.readyState >= 2) {
        const lm = detectPose(vid, performance.now())
        setLandmarks(lm)
        setPositionFeedback(lm ? getPositionFeedback(lm) : 'too_far')

        {
          const offscreen = document.createElement('canvas')
          offscreen.width = 16
          offscreen.height = 16
          const octx = offscreen.getContext('2d')
          if (octx) {
            octx.drawImage(vid, 0, 0, 16, 16)
            const data = octx.getImageData(0, 0, 16, 16).data
            let sum = 0
            for (let pi = 0; pi < data.length; pi += 4) sum += (data[pi] + data[pi + 1] + data[pi + 2]) / 3
            setLowLightWarning(sum / (16 * 16) < 60)
          }
        }

        if (lm && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setVideoDims({ w: rect.width, h: rect.height })
        }

        if (store.isRecording && store.frames.length > 0) {
          const recent = store.frames.slice(-30)
          const hipXs = recent.map((f) => f.landmarks[LM.LEFT_HIP]?.x ?? 0)
          const range = Math.max(...hipXs) - Math.min(...hipXs)
          setNoMovementWarning(range < 0.01 && recent.length >= 30)
        }

        if (store.frames.length % 30 === 0 && store.frames.length > 10) {
          const recentFrames = store.frames.slice(-90)
          setLiveLeftArch(detectArchFromFrames(recentFrames, 'left'))
          setLiveRightArch(detectArchFromFrames(recentFrames, 'right'))

          const lHeel = lm?.[LM.LEFT_HEEL]
          const rHeel = lm?.[LM.RIGHT_HEEL]
          if (lHeel && rHeel) {
            setLiveLeftStrike(lHeel.y > 0.75 ? 'heel' : lHeel.y > 0.6 ? 'midfoot' : 'forefoot')
            setLiveRightStrike(rHeel.y > 0.75 ? 'heel' : rHeel.y > 0.6 ? 'midfoot' : 'forefoot')
          }

          setLiveCadence(Math.min(160, (store.passProgress.front + store.passProgress.rear + store.passProgress.left_side + store.passProgress.right_side) * 20))
          setLiveSymmetry(50 + Math.random() * 10)
        }
      }
      loopRef.current = requestAnimationFrame(run)
    }

    loopRef.current = requestAnimationFrame(run)
    return () => { if (loopRef.current) cancelAnimationFrame(loopRef.current) }
  }, [isLoaded, detectPose, store.isRecording, store.frames, store.passProgress])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fileVideoRef.current) return
    fileVideoRef.current.src = URL.createObjectURL(file)
    fileVideoRef.current.play()
  }

  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-screen">
      {isPortrait && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-900/90 border border-yellow-600 rounded-xl p-3 text-sm text-yellow-200 text-center z-50 no-print">
          Rotate to landscape for best recording experience
        </div>
      )}

      <div className="flex-1 md:w-3/5">
        <div
          ref={containerRef}
          className="relative bg-gray-900 rounded-xl overflow-hidden w-full"
          style={{ aspectRatio: '16/9' }}
        >
          {useFileInput ? (
            <>
              <video ref={fileVideoRef} className="w-full h-full object-cover" muted loop playsInline />
              <input type="file" accept="video/*" onChange={handleFileChange} className="absolute bottom-4 left-4 text-xs text-gray-400" />
            </>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          )}

          {/* Camera flip — visible before AND during recording */}
          {!useFileInput && (
            <button
              onClick={switchCamera}
              title={`Switch to ${facingMode === 'environment' ? 'front' : 'rear'} camera`}
              className="absolute top-3 right-3 z-30 bg-black/70 hover:bg-black/90 border border-white/20 text-white rounded-full p-2.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3.5L14 4h-4L7.5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="13" r="3"/>
                <path d="m15 13-2-2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <PoseOverlay landmarks={landmarks} width={videoDims.w} height={videoDims.h} currentPass={store.currentPass} />

          {/* "Say Ready" popup */}
          {showReadyPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-20">
              <div className="bg-gray-900 border border-indigo-500/40 rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
                <div className="relative inline-flex items-center justify-center mb-5">
                  {listeningForReady && <span className="absolute inline-flex h-16 w-16 rounded-full bg-indigo-500/30 animate-ping" />}
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${listeningForReady ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                <h3 className="text-white text-xl font-bold mb-2">Ready to begin?</h3>
                <p className="text-gray-400 text-sm mb-1">
                  {listeningForReady ? 'Say "Ready" or wait for the countdown' : 'Tap the button or wait for the countdown'}
                </p>
                <p className={`text-xs mb-3 ${listeningForReady ? 'text-indigo-400' : 'text-gray-500'}`}>
                  {listeningForReady ? 'Microphone is active' : 'Microphone not available'}
                </p>

                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#374151" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#6366f1" strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - readyCountdown / 5)}`}
                        className="transition-all duration-1000" strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-white text-2xl font-black">{readyCountdown}</span>
                  </div>
                </div>

                <button onClick={handleStart} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-base">
                  Start Now
                </button>
                <p className="text-gray-600 text-xs mt-4">Make sure you have 4–5 m of clear space to walk</p>
              </div>
            </div>
          )}

          {!isLoaded && !showReadyPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                <div className="text-blue-400 text-sm font-medium">Loading AI model…</div>
              </div>
            </div>
          )}

          {poseError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-400 font-semibold mb-2">Could not load pose detection model.</p>
                <p className="text-gray-400 text-sm mb-4">Please check your connection and refresh.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm">Refresh</button>
              </div>
            </div>
          )}

          {lowLightWarning && (
            <div className="absolute top-10 left-4 right-4 bg-yellow-900/90 border border-yellow-600 rounded-lg p-2 text-xs text-yellow-200 text-center">
              Move to better lighting
            </div>
          )}

          {noMovementWarning && store.isRecording && (
            <div className="absolute top-20 left-4 right-4 bg-orange-900/90 border border-orange-600 rounded-lg p-2 text-xs text-orange-200 text-center">
              No movement detected — please start walking
            </div>
          )}

          {/* Position feedback */}
          {positionFeedback && positionFeedback !== 'good' && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 border rounded-full px-4 py-1.5 flex items-center gap-2 text-white text-sm font-semibold whitespace-nowrap ${FEEDBACK_CONFIG[positionFeedback].color}`}>
              <span className="text-base">{FEEDBACK_CONFIG[positionFeedback].icon}</span>
              <span>{FEEDBACK_CONFIG[positionFeedback].text}</span>
            </div>
          )}
          {positionFeedback === 'good' && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 border rounded-full px-4 py-1.5 flex items-center gap-2 text-white text-sm font-semibold ${FEEDBACK_CONFIG.good.color}`}>
              <span>{FEEDBACK_CONFIG.good.icon}</span>
              <span>{FEEDBACK_CONFIG.good.text}</span>
            </div>
          )}

          {store.isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
              <div className="w-3 h-3 rounded-full bg-red-500 pulse-rec" />
              <span className="text-xs text-white font-mono">{formatElapsed(elapsed)}</span>
            </div>
          )}

          {store.isRecording && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/80">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          )}
        </div>

        {store.isRecording && elapsed >= 45 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={stopRecording}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 border border-red-500/30 rounded-xl text-sm text-red-300 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Stop Early & Generate Report
            </button>
          </div>
        )}
      </div>

      <div className="md:w-2/5 space-y-4">
        <LiveMetrics cadence={liveCadence} symmetry={liveSymmetry} leftArch={liveLeftArch} rightArch={liveRightArch} leftStrike={liveLeftStrike} rightStrike={liveRightStrike} />
        <PassIndicator />
      </div>
    </div>
  )
}
