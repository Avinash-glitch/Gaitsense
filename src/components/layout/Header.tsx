import { useGaitStore } from '../../store/gaitStore'
import type { AppScreen } from '../../types/gait.types'

const SCREENS: AppScreen[] = ['welcome', 'camera_setup', 'protocol', 'recording', 'report']
const SCREEN_LABELS: Record<AppScreen, string> = {
  welcome: 'Welcome',
  camera_setup: 'Camera',
  protocol: 'Protocol',
  recording: 'Recording',
  report: 'Report',
}

export default function Header() {
  const currentScreen = useGaitStore((s) => s.currentScreen)
  const currentIdx = SCREENS.indexOf(currentScreen)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 h-14 flex items-center px-4 no-print">
      <div className="flex items-center gap-2 flex-1">
        {/* Footprint icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500">
          <ellipse cx="9" cy="6" rx="3" ry="4" fill="currentColor" opacity="0.9" />
          <ellipse cx="15" cy="8" rx="2" ry="3" fill="currentColor" opacity="0.7" />
          <ellipse cx="6" cy="13" rx="2" ry="3" fill="currentColor" opacity="0.5" />
          <path d="M8 14 Q12 18 14 20 Q16 22 18 21 Q20 20 18 18 Q16 16 12 13 Z" fill="currentColor" />
        </svg>
        <span className="text-white font-bold text-lg tracking-tight">Gaitsense</span>
      </div>

      {/* Step indicator */}
      <nav className="flex items-center gap-1">
        {SCREENS.filter((s) => s !== 'recording' && s !== 'report' || currentIdx >= SCREENS.indexOf(s)).map((screen, i) => {
          const idx = SCREENS.indexOf(screen)
          const isActive = idx === currentIdx
          const isDone = idx < currentIdx
          return (
            <div key={screen} className="flex items-center gap-1">
              {i > 0 && (
                <div className={`w-6 h-px ${isDone || isActive ? 'bg-blue-500' : 'bg-gray-700'}`} />
              )}
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isDone
                  ? 'text-blue-400'
                  : 'text-gray-600'
              }`}>
                <span>{SCREEN_LABELS[screen]}</span>
              </div>
            </div>
          )
        })}
      </nav>
    </header>
  )
}
