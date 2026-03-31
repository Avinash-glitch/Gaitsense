import type { Recommendation } from '../../types/gait.types'

interface RecommendationsProps {
  recommendations: Recommendation[]
}

const severityStyle: Record<Recommendation['severity'], string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  concern: 'bg-red-500/10 border-red-500/30 text-red-400',
}

const categoryIcon: Record<Recommendation['category'], string> = {
  footwear: '👟',
  strengthening: '💪',
  stretching: '🧘',
  medical: '🏥',
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <div
          key={i}
          className={`border rounded-xl p-4 ${severityStyle[rec.severity]}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{categoryIcon[rec.category]}</span>
            <div>
              <p className="font-semibold text-sm mb-1">{rec.title}</p>
              <p className="text-xs opacity-80 leading-relaxed">{rec.detail}</p>
            </div>
            <span className={`ml-auto text-xs font-bold uppercase tracking-wider flex-shrink-0 ${severityStyle[rec.severity].split(' ')[2]}`}>
              {rec.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
