import { useGaitStore } from '../../store/gaitStore'
import type { WalkPass } from '../../types/gait.types'

const PASSES: { pass: WalkPass; label: string; icon: string }[] = [
  { pass: 'rear', label: 'Rear', icon: '⬆' },
  { pass: 'right_side', label: 'Right', icon: '➡' },
  { pass: 'front', label: 'Front', icon: '⬇' },
  { pass: 'left_side', label: 'Left', icon: '⬅' },
]

const PASS_DESCRIPTIONS: Record<WalkPass, string> = {
  rear: 'Rear View — Heel lift & Hip symmetry',
  right_side: 'Right Side — Arch & Strike pattern',
  front: 'Front View — Toe angle & Knee valgus',
  left_side: 'Left Side — Arch & Ankle flex',
  unknown: 'Detecting direction…',
}

export default function PassIndicator() {
  const currentPass = useGaitStore((s) => s.currentPass)
  const passProgress = useGaitStore((s) => s.passProgress)

  const currentStrideCount = passProgress[currentPass] ?? 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 no-print">
      {/* Mini room diagram */}
      <div className="flex justify-center mb-3">
        <svg width="120" height="100" viewBox="0 0 120 100">
          {/* Room rectangle */}
          <rect x="15" y="10" width="90" height="60" rx="4" fill="none" stroke="#374151" strokeWidth="1.5" />

          {/* Camera */}
          <rect x="51" y="78" width="18" height="12" rx="2" fill="#1e40af" />
          <circle cx="60" cy="84" r="3" fill="#93c5fd" />
          <text x="60" y="97" textAnchor="middle" fill="#6b7280" fontSize="7">CAM</text>

          {/* Pass arrows */}
          {/* Rear - up */}
          <line x1="60" y1="70" x2="60" y2="15" stroke={currentPass === 'rear' ? '#3b82f6' : passProgress.rear >= 3 ? '#22c55e' : '#374151'} strokeWidth="2" markerEnd="url(#a1)" />
          {/* Right side */}
          <line x1="15" y1="40" x2="105" y2="40" stroke={currentPass === 'right_side' ? '#3b82f6' : passProgress.right_side >= 3 ? '#22c55e' : '#374151'} strokeWidth="2" markerEnd="url(#a2)" />
          {/* Front - down */}
          <line x1="60" y1="15" x2="60" y2="70" stroke={currentPass === 'front' ? '#3b82f6' : passProgress.front >= 3 ? '#22c55e' : '#374151'} strokeWidth="2" opacity="0.3" />
          {/* Left side */}
          <line x1="105" y1="40" x2="15" y2="40" stroke={currentPass === 'left_side' ? '#3b82f6' : passProgress.left_side >= 3 ? '#22c55e' : '#374151'} strokeWidth="2" opacity="0.3" />

          {/* Current person indicator */}
          <circle cx="60" cy="40" r="5" fill="#3b82f6" opacity="0.8" />

          {/* Arrows */}
          <defs>
            <marker id="a1" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#3b82f6" />
            </marker>
            <marker id="a2" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Current pass label */}
      <p className="text-xs text-blue-400 font-medium text-center mb-2">
        {PASS_DESCRIPTIONS[currentPass]}
      </p>

      {/* Stride counter */}
      {currentPass !== 'unknown' && (
        <div className="text-center mb-3">
          <span className="text-2xl font-bold text-white">{currentStrideCount}</span>
          <span className="text-gray-500 text-sm"> / 3 strides</span>
        </div>
      )}

      {/* Pass icons row */}
      <div className="flex justify-center gap-2">
        {PASSES.map(({ pass, icon }) => {
          const done = passProgress[pass] >= 3
          const active = currentPass === pass
          return (
            <div
              key={pass}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : active
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 scale-110'
                  : 'bg-gray-800 text-gray-600 border border-gray-700'
              }`}
            >
              {done ? '✓' : icon}
            </div>
          )
        })}
      </div>
    </div>
  )
}
