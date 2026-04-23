interface GaitScoreGaugeProps {
  score: number
}

export default function GaitScoreGauge({ score }: GaitScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const pct = clamped / 100

  // Arc from -210° to +30° (240° total sweep)
  const r = 70
  const cx = 90
  const cy = 95
  const startAngle = -210
  const endAngle = 30
  const totalDeg = endAngle - startAngle

  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg))
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg))

  // Colored zone arcs: red 0–40, amber 40–70, green 70–100
  const zonePath = (from: number, to: number) => {
    const a1 = startAngle + totalDeg * (from / 100)
    const a2 = startAngle + totalDeg * (to / 100)
    const large = (a2 - a1) > 180 ? 1 : 0
    return `M ${arcX(a1)} ${arcY(a1)} A ${r} ${r} 0 ${large} 1 ${arcX(a2)} ${arcY(a2)}`
  }

  // Fill arc for actual score
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

  // Tick mark positions for 0, 40, 70, 100
  const tickOuter = r + 8
  const tickInner = r + 2
  const ticks = [
    { val: 0, label: '0', color: '#ef4444' },
    { val: 40, label: '40', color: '#f59e0b' },
    { val: 70, label: '70', color: '#22c55e' },
    { val: 100, label: '100', color: '#22c55e' },
  ]

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="145" viewBox="0 0 180 145">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Zone bands (background, low opacity) */}
        <path d={zonePath(0, 40)} fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="butt" opacity="0.18" />
        <path d={zonePath(40, 70)} fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="butt" opacity="0.18" />
        <path d={zonePath(70, 100)} fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="butt" opacity="0.18" />

        {/* Gray track */}
        <path
          d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`}
          fill="none" stroke="#1f2937" strokeWidth="10" strokeLinecap="round"
        />

        {/* Colored fill arc */}
        {clamped > 0 && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" filter="url(#glow)" />
        )}

        {/* Tick marks */}
        {ticks.map(({ val, label, color: tc }) => {
          const ang = startAngle + totalDeg * (val / 100)
          const ox = cx + tickOuter * Math.cos(toRad(ang))
          const oy = cy + tickOuter * Math.sin(toRad(ang))
          const ix = cx + tickInner * Math.cos(toRad(ang))
          const iy = cy + tickInner * Math.sin(toRad(ang))
          const lx = cx + (tickOuter + 10) * Math.cos(toRad(ang))
          const ly = cy + (tickOuter + 10) * Math.sin(toRad(ang))
          return (
            <g key={val}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke={tc} strokeWidth="1.5" opacity="0.7" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={tc} fontSize="7.5" opacity="0.8">{label}</text>
            </g>
          )
        })}

        {/* Score text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="34" fontWeight="bold">{clamped}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize="10">/ 100</text>
      </svg>
      <p className="text-sm font-semibold mt-1" style={{ color }}>{verdict}</p>
    </div>
  )
}
