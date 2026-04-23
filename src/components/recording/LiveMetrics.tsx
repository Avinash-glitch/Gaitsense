import { useGaitStore } from '../../store/gaitStore'
import type { ArchType, StrikePattern, WalkPass } from '../../types/gait.types'

interface LiveMetricsProps {
  cadence: number
  symmetry: number
  leftArch: ArchType
  rightArch: ArchType
  leftStrike: StrikePattern
  rightStrike: StrikePattern
}

// Arch SVG icons
const ArchIcon = ({ type, className }: { type: ArchType; className?: string }) => {
  if (type === 'flat') {
    return (
      <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 16 Q12 15 20 16" />
        <line x1="4" y1="19" x2="20" y2="19" />
      </svg>
    )
  }
  if (type === 'high') {
    return (
      <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 18 Q12 5 20 18" />
        <line x1="4" y1="19" x2="20" y2="19" />
      </svg>
    )
  }
  return (
    <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 17 Q12 10 20 17" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </svg>
  )
}

// Strike pattern SVG icons
const StrikeIcon = ({ type, className }: { type: StrikePattern; className?: string }) => {
  if (type === 'heel') {
    return (
      <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18 Q8 10 14 8 Q18 7 19 10 Q20 14 16 17 Q12 20 6 18 Z" />
        <circle cx="7" cy="17" r="2" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    )
  }
  if (type === 'forefoot') {
    return (
      <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18 Q8 10 14 8 Q18 7 19 10 Q20 14 16 17 Q12 20 6 18 Z" />
        <circle cx="17" cy="11" r="2" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    )
  }
  return (
    <svg className={className ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18 Q8 10 14 8 Q18 7 19 10 Q20 14 16 17 Q12 20 6 18 Z" />
      <line x1="10" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
    </svg>
  )
}

const archColor: Record<ArchType, string> = {
  flat: 'text-red-400',
  neutral: 'text-green-400',
  high: 'text-yellow-400',
}
const strikeColor: Record<StrikePattern, string> = {
  heel: 'text-orange-400',
  midfoot: 'text-green-400',
  forefoot: 'text-blue-400',
}

const PASS_BADGE: Record<WalkPass, { label: string; color: string }> = {
  front: { label: 'FRONT', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  rear: { label: 'REAR', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  left_side: { label: 'LEFT SIDE', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  right_side: { label: 'RIGHT SIDE', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  unknown: { label: 'DETECTING…', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

function CadenceGauge({ value }: { value: number }) {
  const max = 160
  const pct = Math.min(1, value / max)
  const angle = pct * 180 - 90
  const isGood = value >= 100 && value <= 120

  const cx = 60
  const cy = 60
  const r = 45
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg - 90))
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg - 90))

  const arcPath = `M ${arcX(-90)} ${arcY(-90)} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${arcX(angle)} ${arcY(angle)}`

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#374151" strokeWidth="8" strokeLinecap="round"
        />
        {/* Green zone 100–120 */}
        <path
          d={`M ${arcX((100 / max) * 180 - 90)} ${arcY((100 / max) * 180 - 90)} A ${r} ${r} 0 0 1 ${arcX((120 / max) * 180 - 90)} ${arcY((120 / max) * 180 - 90)}`}
          fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="10"
        />
        {value > 0 && (
          <path d={arcPath} fill="none" stroke={isGood ? '#22c55e' : '#f59e0b'} strokeWidth="6" strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {value > 0 ? Math.round(value) : '–'}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize="8">steps/min</text>
        <text x="14" y={cy + 4} fill="#6b7280" fontSize="7">0</text>
        <text x="94" y={cy + 4} fill="#6b7280" fontSize="7">160</text>
      </svg>
      <p className="text-xs text-gray-500 mt-1">Cadence</p>
    </div>
  )
}

export default function LiveMetrics({ cadence, symmetry, leftArch, rightArch, leftStrike, rightStrike }: LiveMetricsProps) {
  const currentPass = useGaitStore((s) => s.currentPass)
  const badge = PASS_BADGE[currentPass]

  // Symmetry bar: center split. offset from center represents imbalance.
  // symmetry=100 → perfectly balanced, symmetry=50 → max asymmetry
  const leftPct = symmetry / 2          // left half fill (0–50%)
  const rightPct = symmetry / 2         // right half fill (0–50%)
  const barColor = symmetry >= 85 ? 'bg-green-500' : symmetry >= 70 ? 'bg-yellow-500' : 'bg-orange-500'

  return (
    <div className="space-y-4 no-print">
      {/* Pass badge */}
      <div className={`border rounded-lg px-3 py-2 text-center text-xs font-bold tracking-wider ${badge.color}`}>
        {badge.label}
      </div>

      {/* Cadence gauge */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-center">
        <CadenceGauge value={cadence} />
      </div>

      {/* Symmetry bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>LEFT</span>
          <span className="text-white font-bold">{Math.round(symmetry)}% symmetry</span>
          <span>RIGHT</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          {/* Left half */}
          <div className="flex-1 flex justify-end">
            <div className={`h-full ${barColor} rounded-l-full transition-all duration-300`} style={{ width: `${leftPct * 2}%` }} />
          </div>
          {/* 1px center divider */}
          <div className="w-px bg-gray-600 flex-shrink-0" />
          {/* Right half */}
          <div className="flex-1 flex justify-start">
            <div className={`h-full ${barColor} rounded-r-full transition-all duration-300`} style={{ width: `${rightPct * 2}%` }} />
          </div>
        </div>
      </div>

      {/* Strike pattern */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-2">Strike Pattern</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className={`flex justify-center mb-1 ${strikeColor[leftStrike]}`}>
              <StrikeIcon type={leftStrike} className="w-6 h-6" />
            </div>
            <div className={`text-xs font-medium ${strikeColor[leftStrike]}`}>L · {leftStrike}</div>
          </div>
          <div className="text-center">
            <div className={`flex justify-center mb-1 ${strikeColor[rightStrike]}`}>
              <StrikeIcon type={rightStrike} className="w-6 h-6" />
            </div>
            <div className={`text-xs font-medium ${strikeColor[rightStrike]}`}>R · {rightStrike}</div>
          </div>
        </div>
      </div>

      {/* Arch type */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-2">Arch Type</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className={`flex justify-center mb-1 ${archColor[leftArch]}`}>
              <ArchIcon type={leftArch} className="w-6 h-6" />
            </div>
            <div className={`text-xs font-medium ${archColor[leftArch]}`}>L · {leftArch}</div>
          </div>
          <div className="text-center">
            <div className={`flex justify-center mb-1 ${archColor[rightArch]}`}>
              <ArchIcon type={rightArch} className="w-6 h-6" />
            </div>
            <div className={`text-xs font-medium ${archColor[rightArch]}`}>R · {rightArch}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
