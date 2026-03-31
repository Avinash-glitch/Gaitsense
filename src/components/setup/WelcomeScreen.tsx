import { useGaitStore } from '../../store/gaitStore'

export default function WelcomeScreen() {
  const setScreen = useGaitStore((s) => s.setScreen)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
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
        {[
          { icon: '🔄', label: '360° Analysis' },
          { icon: '🦶', label: 'Arch Detection' },
          { icon: '🤖', label: 'AI Recommendations' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-gray-200"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Metrics preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-2xl w-full">
        {[
          'Foot Strike Pattern',
          'Arch Type',
          'Step Cadence',
          'Gait Symmetry',
          'Toe-out Angle',
          'Ankle Dorsiflexion',
          'Hip Drop',
          'Overall Score',
        ].map((m) => (
          <div key={m} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 text-center">
            {m}
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
