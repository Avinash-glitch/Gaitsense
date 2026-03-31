import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { StepTimelineEntry } from '../../types/gait.types'

interface StepTimelineChartProps {
  data: StepTimelineEntry[]
}

export default function StepTimelineChart({ data }: StepTimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
        Not enough data for timeline
      </div>
    )
  }

  const strikeLines = data.filter((d) => d.leftStrike || d.rightStrike)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="timestamp"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          label={{ value: 'Time (s)', position: 'insideBottomRight', offset: 0, fill: '#6b7280', fontSize: 10 }}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 10 }}
          label={{ value: 'Heel height', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }}
          domain={[0, 1]}
        />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af', fontSize: 11 }}
          itemStyle={{ fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
        {strikeLines.map((d, i) => (
          <ReferenceLine
            key={i}
            x={d.timestamp}
            stroke={d.leftStrike ? '#22c55e' : '#3b82f6'}
            strokeOpacity={0.4}
            strokeDasharray="2,2"
          />
        ))}
        <Line
          type="monotone"
          dataKey="leftHeelY"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          name="Left heel"
        />
        <Line
          type="monotone"
          dataKey="rightHeelY"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Right heel"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
