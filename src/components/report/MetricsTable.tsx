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

function statusIcon(s: MetricCard['status']) {
  switch (s) {
    case 'ok': return '✓'
    case 'warn': return '⚠'
    case 'concern': return '!'
    case 'info': return 'i'
  }
}
function statusColor(s: MetricCard['status']) {
  switch (s) {
    case 'ok': return 'text-green-400'
    case 'warn': return 'text-yellow-400'
    case 'concern': return 'text-red-400'
    case 'info': return 'text-blue-400'
  }
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
        <div key={card.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-gray-500">{card.name}</p>
            <span className={`text-sm font-bold ${statusColor(card.status)}`}>
              {statusIcon(card.status)}
            </span>
          </div>
          <p className="text-lg font-bold text-white capitalize mb-1">{card.value}</p>
          <p className="text-xs text-gray-600">Normal: {card.normal}</p>
        </div>
      ))}
    </div>
  )
}
