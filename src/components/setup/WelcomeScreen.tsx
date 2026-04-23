import { useGaitStore } from '../../store/gaitStore'

const METRIC_ITEMS = [
  {
    label: 'Foot Strike Pattern',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 18c0-4 2-7 4-9" />
        <path d="M12 9c2 2 4 5 4 9" />
        <path d="M6 21h12" />
      </svg>
    ),
  },
  {
    label: 'Arch Type',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 18 Q12 6 20 18" />
      </svg>
    ),
  },
  {
    label: 'Step Cadence',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,7 12,12 15,15" />
      </svg>
    ),
  },
  {
    label: 'Gait Symmetry',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <path d="M5 8 L12 4 L19 8" />
        <path d="M5 16 L12 20 L19 16" />
      </svg>
    ),
  },
  {
    label: 'Toe-out Angle',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 20 L6 8" />
        <path d="M12 20 L18 8" />
        <path d="M7.5 11 A6 6 0 0 1 16.5 11" />
      </svg>
    ),
  },
  {
    label: 'Ankle Dorsiflexion',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 19 L12 6 L19 19" />
        <path d="M9 14 L15 14" />
      </svg>
    ),
  },
  {
    label: 'Hip Drop',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="7" r="3" />
        <path d="M7 20 L12 10 L17 20" />
        <line x1="5" y1="16" x2="19" y2="18" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    label: 'Overall Score',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
]

const FEATURE_PILLS = [
  {
    label: '360° Analysis',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    label: 'Arch Detection',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 18 Q12 4 21 18" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
  {
    label: 'AI Recommendations',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 7.38 16.75" />
        <path d="M12 2a10 10 0 0 0-7.38 16.75" />
        <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
        <line x1="12" y1="11" x2="12" y2="15" />
      </svg>
    ),
  },
]

export default function WelcomeScreen() {
  const setScreen = useGaitStore((s) => s.setScreen)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-500/20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-blue-400">
            <ellipse cx="18" cy="12" rx="6" ry="8" fill="currentColor" opacity="0.9" />
            <ellipse cx="30" cy="16" rx="4" ry="6" fill="currentColor" opacity="0.7" />
            <ellipse cx="12" cy="26" rx="4" ry="6" fill="currentColor" opacity="0.5" />
            <path d="M16 28 Q24 36 28 40 Q32 44 36 42 Q40 40 36 36 Q32 32 24 26 Z" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight text-center">
          GaitSense <span className="text-blue-500">AI</span>
        </h1>
        <p className="text-lg text-gray-400 text-center max-w-md">
          Clinical-grade gait analysis from any smartphone or webcam
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        {FEATURE_PILLS.map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-gray-200"
          >
            <span className="text-blue-400">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Metrics preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-2xl w-full">
        {METRIC_ITEMS.map(({ label, icon }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col items-center gap-1.5 text-center hover:border-gray-700 transition-colors"
          >
            <span className="text-blue-400/70">{icon}</span>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => setScreen('camera_setup')}
        className="px-10 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-lg font-bold rounded-2xl transition-colors shadow-lg shadow-blue-500/20 mb-4"
      >
        Begin Analysis
      </button>

      <p className="text-xs text-gray-600">
        No account needed · All processing happens on your device
      </p>
    </div>
  )
}
