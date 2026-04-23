import type { GaitMetrics } from '../../types/gait.types'

interface MetricsTableProps {
  metrics: GaitMetrics
}

interface MetricCard {
  name: string
  value: string
  normal: string
  status: 'ok' | 'warn' | 'concern' | 'info'
}

function StatusBadge({ status }: { status: MetricCard['status'] }) {
  if (status === 'ok') {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-green-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2,6 5,9 10,3" />
        </svg>
      </div>
    )
  }
  if (status === 'warn') {
    return (
      <div className="w-5 h-5 rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}>
        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L19 17H1L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="14.5" r="0.8" fill="currentColor" />
        </svg>
      </div>
    )
  }
  if (status === 'concern') {
    return (
      <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-red-400" viewBox="0 0 12 12" fill="none">
          <line x1="6" y1="3" x2="6" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="6" cy="9.5" r="0.9" fill="currentColor" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-blue-400" viewBox="0 0 12 12" fill="none">
        <line x1="6" y1="5" x2="6" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="6" cy="3" r="0.9" fill="currentColor" />
      </svg>
    </div>
  )
}

const borderColor: Record<MetricCard['status'], string> = {
  ok: 'border-l-green-500/50',
  warn: 'border-l-yellow-500/50',
  concern: 'border-l-red-500/50',
  info: 'border-l-blue-500/50',
}

export default function MetricsTable({ metrics }: MetricsTableProps) {
  const cards: MetricCard[] = [
    {
      name: 'Cadence',
      value: metrics.cadence > 0 ? `${Math.round(metrics.cadence)} steps/min` : 'Not enough data',
      normal: '100–120 steps/min',
      status: metrics.cadence >= 100 && metrics.cadence <= 120 ? 'ok' : metrics.cadence > 0 ? 'warn' : 'info',
    },
    {
      name: 'Symmetry',
      value: `${Math.round(metrics.symmetryScore)}%`,
      normal: '>85%',
      status: metrics.symmetryScore >= 85 ? 'ok' : metrics.symmetryScore >= 70 ? 'warn' : 'concern',
    },
    {
      name: 'Left Arch',
      value: metrics.leftArch,
      normal: 'Neutral',
      status: metrics.leftArch === 'neutral' ? 'ok' : metrics.leftArch === 'high' ? 'warn' : 'concern',
    },
    {
      name: 'Right Arch',
      value: metrics.rightArch,
      normal: 'Neutral',
      status: metrics.rightArch === 'neutral' ? 'ok' : metrics.rightArch === 'high' ? 'warn' : 'concern',
    },
    {
      name: 'Left Strike',
      value: metrics.leftStrikePattern,
      normal: 'Midfoot',
      status: metrics.leftStrikePattern === 'midfoot' ? 'ok' : metrics.leftStrikePattern === 'forefoot' ? 'info' : 'warn',
    },
    {
      name: 'Right Strike',
      value: metrics.rightStrikePattern,
      normal: 'Midfoot',
      status: metrics.rightStrikePattern === 'midfoot' ? 'ok' : metrics.rightStrikePattern === 'forefoot' ? 'info' : 'warn',
    },
    {
      name: 'Left Toe Angle',
      value: `${metrics.leftToeAngle.toFixed(1)}°`,
      normal: '5–18° toe-out',
      status: metrics.leftToeAngle >= 5 && metrics.leftToeAngle <= 18 ? 'ok' : 'warn',
    },
    {
      name: 'Right Toe Angle',
      value: `${metrics.rightToeAngle.toFixed(1)}°`,
      normal: '5–18° toe-out',
      status: metrics.rightToeAngle >= 5 && metrics.rightToeAngle <= 18 ? 'ok' : 'warn',
    },
    {
      name: 'L Dorsiflexion',
      value: `${metrics.leftAnkleDorsiflexion.toFixed(1)}°`,
      normal: '0–10°',
      status: metrics.leftAnkleDorsiflexion >= 0 && metrics.leftAnkleDorsiflexion <= 15 ? 'ok' : 'warn',
    },
    {
      name: 'R Dorsiflexion',
      value: `${metrics.rightAnkleDorsiflexion.toFixed(1)}°`,
      normal: '0–10°',
      status: metrics.rightAnkleDorsiflexion >= 0 && metrics.rightAnkleDorsiflexion <= 15 ? 'ok' : 'warn',
    },
    {
      name: 'Step Width',
      value: `~${metrics.stepWidth} cm`,
      normal: '5–15 cm',
      status: 'info',
    },
    {
      name: 'Step Count',
      value: `${metrics.stepCount}`,
      normal: 'N/A',
      status: 'info',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.name}
          className={`bg-gray-900 border border-gray-800 border-l-2 ${borderColor[card.status]} rounded-xl p-4`}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-gray-500">{card.name}</p>
            <StatusBadge status={card.status} />
          </div>
          <p className="text-lg font-bold text-white capitalize mb-1">{card.value}</p>
          <p className="text-xs text-gray-600">Normal: {card.normal}</p>
        </div>
      ))}
    </div>
  )
}
