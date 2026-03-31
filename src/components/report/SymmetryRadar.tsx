import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { GaitMetrics } from '../../types/gait.types'

interface SymmetryRadarProps {
  metrics: GaitMetrics
}

export default function SymmetryRadar({ metrics }: SymmetryRadarProps) {
  const normalize = (val: number, min: number, max: number) =>
    Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))

  const data = [
    {
      axis: 'Cadence',
      left: normalize(metrics.cadence, 60, 160),
      right: normalize(metrics.cadence, 60, 160),
    },
    {
      axis: 'Strike\nPattern',
      left: metrics.leftStrikePattern === 'midfoot' ? 100 : metrics.leftStrikePattern === 'forefoot' ? 70 : 40,
      right: metrics.rightStrikePattern === 'midfoot' ? 100 : metrics.rightStrikePattern === 'forefoot' ? 70 : 40,
    },
    {
      axis: 'Toe Angle',
      left: normalize(metrics.leftToeAngle, 0, 30),
      right: normalize(metrics.rightToeAngle, 0, 30),
    },
    {
      axis: 'Dorsiflexion',
      left: normalize(metrics.leftAnkleDorsiflexion, -10, 20),
      right: normalize(metrics.rightAnkleDorsiflexion, -10, 20),
    },
    {
      axis: 'Arch',
      left: metrics.leftArch === 'neutral' ? 100 : metrics.leftArch === 'high' ? 70 : 40,
      right: metrics.rightArch === 'neutral' ? 100 : metrics.rightArch === 'high' ? 70 : 40,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
        <PolarGrid stroke="#1f2937" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 9 }}
        />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          itemStyle={{ fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
        <Radar name="Left foot" dataKey="left" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
        <Radar name="Right foot" dataKey="right" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
