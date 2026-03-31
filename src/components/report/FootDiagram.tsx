import type { ArchType, GaitSide, StrikePattern } from '../../types/gait.types'

interface FootDiagramProps {
  side: GaitSide
  arch: ArchType
  strike: StrikePattern
  toeAngle: number
}

const archColors: Record<ArchType, string> = {
  flat: '#ef4444',
  neutral: '#22c55e',
  high: '#a855f7',
}

export default function FootDiagram({ side, arch, strike, toeAngle }: FootDiagramProps) {
  const flip = side === 'right' ? -1 : 1
  const archColor = archColors[arch]

  // Strike zone highlight coordinates
  const heelZone = { x: 50, y: 120, w: 40, h: 30 }
  const midfootZone = { x: 45, y: 80, w: 50, h: 35 }
  const forefootZone = { x: 40, y: 30, w: 60, h: 45 }

  const strikeZone =
    strike === 'heel' ? heelZone : strike === 'midfoot' ? midfootZone : forefootZone

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="120"
        height="170"
        viewBox="0 0 120 170"
        style={{ transform: `scaleX(${flip})` }}
      >
        {/* Foot outline */}
        <path
          d="M 55 155 Q 30 150 28 130 Q 25 110 30 90 Q 32 70 35 55 Q 38 35 45 20 Q 50 12 60 10 Q 70 10 75 18 Q 80 28 78 45 Q 76 60 80 75 Q 85 90 87 105 Q 90 120 88 135 Q 85 150 70 155 Z"
          fill="#1f2937"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Arch line */}
        <path
          d={
            arch === 'flat'
              ? 'M 35 125 Q 55 120 80 118'
              : arch === 'high'
              ? 'M 35 125 Q 55 100 80 118'
              : 'M 35 125 Q 55 110 80 118'
          }
          fill="none"
          stroke={archColor}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Strike zone highlight */}
        <rect
          x={strikeZone.x}
          y={strikeZone.y}
          width={strikeZone.w}
          height={strikeZone.h}
          rx="8"
          fill={
            strike === 'heel'
              ? 'rgba(251,146,60,0.4)'
              : strike === 'midfoot'
              ? 'rgba(34,197,94,0.4)'
              : 'rgba(96,165,250,0.4)'
          }
        />

        {/* Toe angle arrow */}
        {Math.abs(toeAngle) > 3 && (
          <g transform={`translate(60, 30) rotate(${toeAngle * flip})`}>
            <line x1="0" y1="0" x2="0" y2="-20" stroke="#facc15" strokeWidth="2" />
            <line x1="0" y1="-20" x2="-4" y2="-14" stroke="#facc15" strokeWidth="2" />
            <line x1="0" y1="-20" x2="4" y2="-14" stroke="#facc15" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="text-center" style={{ transform: `scaleX(${flip})` }}>
        <p className="text-xs font-semibold text-gray-300 capitalize">{side} foot</p>
        <p className="text-xs" style={{ color: archColor }}>{arch} arch</p>
        <p className="text-xs text-gray-500 capitalize">{strike} strike</p>
        <p className="text-xs text-yellow-400">{toeAngle.toFixed(1)}° {toeAngle > 0 ? 'out' : 'in'}</p>
      </div>
    </div>
  )
}
