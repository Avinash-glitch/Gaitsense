import { useGaitStore } from '../../store/gaitStore'

const PASSES = [
  {
    label: 'Pass 1 — Away',
    icon: '⬆',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    captures: 'Rear view · Heel lift · Hip symmetry',
  },
  {
    label: 'Pass 2 — Right',
    icon: '➡',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    captures: 'Right side · Arch · Ankle flex · Strike',
  },
  {
    label: 'Pass 3 — Toward',
    icon: '⬇',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    captures: 'Front view · Toe angle · Knee valgus',
  },
  {
    label: 'Pass 4 — Left',
    icon: '⬅',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    captures: 'Left side · Arch · Ankle flex · Strike',
  },
]

export default function ProtocolExplainer() {
  const setScreen = useGaitStore((s) => s.setScreen)

  const handleStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      // Mic permission not critical
    }
    setScreen('recording')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Walking Protocol</h2>
      <p className="text-gray-400 mb-6">
        Walk around a rectangular path. The camera captures all angles from one fixed position.
      </p>

      {/* Animated diagram */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 flex justify-center">
        <svg width="260" height="200" viewBox="0 0 260 200" className="overflow-visible">
          {/* Walking rectangle */}
          <rect x="40" y="20" width="180" height="130" rx="8" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="6,3" />

          {/* Camera icon at bottom center */}
          <g transform="translate(117,178)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#1e40af" />
            <circle cx="0" cy="0" r="5" fill="#93c5fd" />
            <rect x="10" y="-6" width="8" height="12" rx="2" fill="#1e40af" />
            <text x="0" y="18" textAnchor="middle" fill="#60a5fa" fontSize="9">CAMERA</text>
          </g>

          {/* Path arrows */}
          {/* Up arrow (pass 1 - rear) */}
          <line x1="130" y1="155" x2="130" y2="30" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          {/* Right arrow (pass 2 - right side) */}
          <line x1="40" y1="20" x2="220" y2="20" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowGreen)" />
          {/* Down arrow (pass 3 - front) */}
          <line x1="220" y1="20" x2="220" y2="150" stroke="#eab308" strokeWidth="2" markerEnd="url(#arrowYellow)" />
          {/* Left arrow (pass 4 - left side) */}
          <line x1="220" y1="150" x2="40" y2="150" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrowPurple)" />

          {/* Person indicator */}
          <circle cx="130" cy="155" r="8" fill="#3b82f6" opacity="0.8">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M0,0 L0,-125 L90,-125 L90,0 L0,0"
            />
          </circle>

          {/* Labels */}
          <text x="100" y="95" fill="#60a5fa" fontSize="9">1·REAR</text>
          <text x="120" y="14" fill="#4ade80" fontSize="9">2·RIGHT</text>
          <text x="224" y="90" fill="#facc15" fontSize="9" transform="rotate(90,224,90)">3·FRONT</text>
          <text x="130" y="165" fill="#c084fc" fontSize="9">4·LEFT</text>

          {/* Arrow markers */}
          <defs>
            <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" />
            </marker>
            <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" />
            </marker>
            <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#eab308" />
            </marker>
            <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Pass cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PASSES.map((p) => (
          <div key={p.label} className={`border rounded-xl p-4 ${p.bg}`}>
            <div className={`text-xl mb-1 ${p.color}`}>{p.icon}</div>
            <div className={`text-sm font-semibold ${p.color} mb-1`}>{p.label}</div>
            <div className="text-xs text-gray-400">{p.captures}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <span className="text-2xl">⏱</span>
        <p className="text-sm text-gray-300">
          Estimated time: <span className="text-white font-semibold">~60–90 seconds</span> · 2 laps of your walking rectangle
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setScreen('camera_setup')}
          className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleStart}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-500/20"
        >
          Start Recording 🎙
        </button>
      </div>
    </div>
  )
}
