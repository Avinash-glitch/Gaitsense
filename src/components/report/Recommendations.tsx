import type { Recommendation } from '../../types/gait.types'

interface RecommendationsProps {
  recommendations: Recommendation[]
}

const severityStyle: Record<Recommendation['severity'], string> = {
  info: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-yellow-500/10 border-yellow-500/30',
  concern: 'bg-red-500/10 border-red-500/30',
}

const severityPill: Record<Recommendation['severity'], string> = {
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  concern: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const severityTextColor: Record<Recommendation['severity'], string> = {
  info: 'text-blue-300',
  warning: 'text-yellow-300',
  concern: 'text-red-300',
}

function CategoryIcon({ category }: { category: Recommendation['category'] }) {
  if (category === 'footwear') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16 Q8 10 14 12 Q18 14 20 16 L20 18 Q14 20 4 18 Z" />
        <path d="M14 12 L16 6 L18 6" />
      </svg>
    )
  }
  if (category === 'strengthening') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="6" y1="10" x2="6" y2="14" />
        <line x1="18" y1="10" x2="18" y2="14" />
        <line x1="3" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
      </svg>
    )
  }
  if (category === 'stretching') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7 L10 14 L7 18" />
        <path d="M12 11 L15 14 L17 18" />
        <path d="M10 14 L14 14" />
      </svg>
    )
  }
  // medical
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
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
            <span className={severityTextColor[rec.severity]}>
              <CategoryIcon category={rec.category} />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm mb-1 ${severityTextColor[rec.severity]}`}>{rec.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{rec.detail}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${severityPill[rec.severity]}`}>
              {rec.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
