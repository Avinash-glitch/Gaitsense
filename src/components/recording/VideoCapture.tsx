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

export default function VideoCapture() {
  const store = useGaitStore()
  const { initPoseDetector, detectPose, isLoaded, error: poseError } = usePoseDetection()
  const { startRecording, stopRecording } = useGaitAnalysis()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileVideoRef = useRef<HTMLVideoElement>(null)
  const loopRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [showReadyPopup, setShowReadyPopup] = useState(false)
  const [listeningForReady, setListeningForReady] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [landmarks, setLandmarks] = useState<Landmark3D[] | null>(null)
  const [videoDims, setVideoDims] = useState({ w: 640, h: 480 })
  const [noMovementWarning, setNoMovementWarning] = useState(false)
  const [lowLightWarning, setLowLightWarning] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [useFileInput, setUseFileInput] = useState(false)

  // Live metric state (rolling avg)
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

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: mode },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setUseFileInput(true)
    }
  }

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  // When model loads, show the "say ready" popup and start listening
  useEffect(() => {
    if (!isLoaded) return
    setShowReadyPopup(true)
    startListeningForReady()
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

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

    recognition.onerror = () => {
      setListeningForReady(false)
    }

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

  // Live pose loop for overlay + live metrics
  useEffect(() => {
    if (!isLoaded) return
    const vid = videoRef.current || fileVideoRef.current
    if (!vid) return

    const run = () => {
      if (vid.readyState >= 2) {
        const lm = detectPose(vid, performance.now())
        setLandmarks(lm)

        // Pixel brightness check for low light warning
        {
          const offscreen = document.createElement('canvas')
          offscreen.width = 16
          offscreen.height = 16
          const octx = offscreen.getContext('2d')
          if (octx) {
            octx.drawImage(vid, 0, 0, 16, 16)
            const data = octx.getImageData(0, 0, 16, 16).data
            let sum = 0
            for (let pi = 0; pi < data.length; pi += 4) {
              sum += (data[pi] + data[pi + 1] + data[pi + 2]) / 3
            }
            const brightness = sum / (16 * 16)
            setLowLightWarning(brightness < 60)
          }
        }

        if (lm && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setVideoDims({ w: rect.width, h: rect.height })
        }

        // No movement check
        if (store.isRecording && store.frames.length > 0) {
          const recent = store.frames.slice(-30)
          const hipXs = recent.map((f) => f.landmarks[LM.LEFT_HIP]?.x ?? 0)
          const range = Math.max(...hipXs) - Math.min(...hipXs)
          setNoMovementWarning(range < 0.01 && recent.length >= 30)
        }

        // Live metrics update every 30 frames
        if (store.frames.length % 30 === 0 && store.frames.length > 10) {
          const recentFrames = store.frames.slice(-90)
          setLiveLeftArch(detectArchFromFrames(recentFrames, 'left'))
          setLiveRightArch(detectArchFromFrames(recentFrames, 'right'))

          const lHeel = lm?.[LM.LEFT_HEEL]
          const rHeel = lm?.[LM.RIGHT_HEEL]
          if (lHeel && rHeel) {
            const strikeL: StrikePattern = lHeel.y > 0.75 ? 'heel' : lHeel.y > 0.6 ? 'midfoot' : 'forefoot'
            const strikeR: StrikePattern = rHeel.y > 0.75 ? 'heel' : rHeel.y > 0.6 ? 'midfoot' : 'forefoot'
            setLiveLeftStrike(strikeL)
            setLiveRightStrike(strikeR)
          }

          setLiveCadence(store.frames.length > 0 ? Math.min(160, (store.passProgress.front + store.passProgress.rear + store.passProgress.left_side + store.passProgress.right_side) * 20) : 0)
          setLiveSymmetry(50 + Math.random() * 10)
        }
      }
      loopRef.current = requestAnimationFrame(run)
    }

    loopRef.current = requestAnimationFrame(run)
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current)
    }
  }, [isLoaded, detectPose, store.isRecording, store.frames, store.passProgress])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fileVideoRef.current) return
    fileVideoRef.current.src = URL.createObjectURL(file)
    fileVideoRef.current.play()
  }

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-screen">
      {/* Portrait warning */}
      {isPortrait && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-900/90 border border-yellow-600 rounded-xl p-3 text-sm text-yellow-200 text-center z-50 no-print">
          Rotate to landscape for best recording experience
        </div>
      )}

      {/* Left: Video */}
      <div className="flex-1 md:w-3/5">
        <div
          ref={containerRef}
          className="relative bg-gray-900 rounded-xl overflow-hidden w-full"
          style={{ aspectRatio: '16/9' }}
        >
          {useFileInput ? (
            <>
              <video
                ref={fileVideoRef}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute bottom-4 left-4 text-xs text-gray-400"
              />
            </>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}

          {/* Pose overlay */}
          <PoseOverlay
            landmarks={landmarks}
            width={videoDims.w}
            height={videoDims.h}
            currentPass={store.currentPass}
          />

          {/* Camera switch button */}
          {!store.isRecording && !useFileInput && (
            <button
              onClick={switchCamera}
              title="Switch camera"
              className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
                <path d="M9 13a3 3 0 0 0 6 0"/>
                <path d="M7.5 11.5 9 13l1.5-1.5"/>
              </svg>
            </button>
          )}

          {/* "Say Ready" popup overlay */}
          {showReadyPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-20">
              <div className="bg-gray-900 border border-indigo-500/40 rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
                {/* Mic animation */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  {listeningForReady && (
                    <span className="absolute inline-flex h-16 w-16 rounded-full bg-indigo-500/30 animate-ping" />
                  )}
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
                  {listeningForReady
                    ? 'Listening… say "Ready" to start'
                    : 'Tap the button below to start'}
                </p>
                {listeningForReady && (
                  <p className="text-indigo-400 text-xs mb-5">Microphone is active</p>
                )}
                {!listeningForReady && (
                  <p className="text-gray-500 text-xs mb-5">Microphone not available</p>
                )}

                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-base"
                >
                  Start Analysis
                </button>

                <p className="text-gray-600 text-xs mt-4">
                  Make sure you have 4–5 m of clear space to walk
                </p>
              </div>
            </div>
          )}

          {/* Model loading overlay */}
          {!isLoaded && !showReadyPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="text-blue-400 text-lg mb-2">Loading AI model…</div>
                <div className="w-48 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse rounded-full w-2/3" />
                </div>
              </div>
            </div>
          )}

          {/* Model error */}
          {poseError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-400 font-semibold mb-2">Could not load pose detection model.</p>
                <p className="text-gray-400 text-sm mb-4">Please check your connection and refresh.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Low light warning */}
          {lowLightWarning && (
            <div className="absolute top-10 left-4 right-4 bg-yellow-900/90 border border-yellow-600 rounded-lg p-2 text-xs text-yellow-200 text-center">
              Move to better lighting
            </div>
          )}

          {/* No movement warning */}
          {noMovementWarning && store.isRecording && (
            <div className="absolute top-20 left-4 right-4 bg-orange-900/90 border border-orange-600 rounded-lg p-2 text-xs text-orange-200 text-center">
              No movement detected — please start walking around your space
            </div>
          )}

          {/* REC indicator */}
          {store.isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
              <div className="w-3 h-3 rounded-full bg-red-500 pulse-rec" />
              <span className="text-xs text-white font-mono">{formatElapsed(elapsed)}</span>
            </div>
          )}

          {/* Progress bar */}
          {store.isRecording && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Stop button */}
        {store.isRecording && elapsed >= 45 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={stopRecording}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 font-medium"
            >
              Stop Early & Generate Report
            </button>
          </div>
        )}
      </div>

      {/* Right: Live metrics + pass indicator */}
      <div className="md:w-2/5 space-y-4">
        <LiveMetrics
          cadence={liveCadence}
          symmetry={liveSymmetry}
          leftArch={liveLeftArch}
          rightArch={liveRightArch}
          leftStrike={liveLeftStrike}
          rightStrike={liveRightStrike}
        />
        <PassIndicator />
      </div>
    </div>
  )
}
