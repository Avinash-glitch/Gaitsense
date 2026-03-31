interface GaitScoreGaugeProps {
  score: number
}

export default function GaitScoreGauge({ score }: GaitScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const pct = clamped / 100

  // Arc from -150° to +150° (300° total)
  const r = 70
  const cx = 90
  const cy = 90
  const startAngle = -210
  const endAngle = 30
  const totalDeg = endAngle - startAngle

  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg))
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg))

  const bgPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`
  const fillAngle = startAngle + totalDeg * pct
  const fillLarge = totalDeg * pct > 180 ? 1 : 0
  const fillPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${fillLarge} 1 ${arcX(fillAngle)} ${arcY(fillAngle)}`

  const color =
    clamped >= 70 ? '#22c55e' : clamped >= 40 ? '#f59e0b' : '#ef4444'

  const verdict =
    clamped >= 80
      ? 'Excellent gait pattern'
      : clamped >= 70
      ? 'Good gait with minor asymmetry'
      : clamped >= 50
      ? 'Fair gait — some areas to improve'
      : 'Gait concerns detected — review recommendations'

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="130" viewBox="0 0 180 130">
        {/* Background track */}
        <path d={bgPath} fill="none" stroke="#1f2937" strokeWidth="12" strokeLinecap="round" />
        {/* Colored fill */}
        {clamped > 0 && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        )}
        {/* Score text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
          {clamped}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#6b7280" fontSize="10">
          / 100
        </text>
        <text x="22" y="100" fill="#6b7280" fontSize="9">0</text>
        <text x="140" y="100" fill="#6b7280" fontSize="9">100</text>
      </svg>
      <p className="text-sm font-medium mt-1" style={{ color }}>{verdict}</p>
    </div>
  )
}
