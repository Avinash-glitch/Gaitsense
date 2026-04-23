import { useGaitStore } from '../../store/gaitStore'
import GaitScoreGauge from './GaitScoreGauge'
import MetricsTable from './MetricsTable'
import StepTimelineChart from './StepTimelineChart'
import SymmetryRadar from './SymmetryRadar'
import FootDiagram from './FootDiagram'
import Recommendations from './Recommendations'
import type { WalkPass } from '../../types/gait.types'

const ALL_PASSES: WalkPass[] = ['front', 'rear', 'left_side', 'right_side']
const PASS_LABELS: Record<WalkPass, string> = {
  front: 'Front',
  rear: 'Rear',
  left_side: 'Left Side',
  right_side: 'Right Side',
  unknown: 'Unknown',
}

function SectionIcon({ type }: { type: 'score' | 'metrics' | 'timeline' | 'symmetry' | 'foot' | 'pass' | 'rec' }) {
  const cls = 'w-4 h-4 text-blue-400 flex-shrink-0'
  if (type === 'score') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
  if (type === 'metrics') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
  if (type === 'timeline') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  )
  if (type === 'symmetry') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M5 8 L12 4 L19 8" />
      <path d="M5 16 L12 20 L19 16" />
    </svg>
  )
  if (type === 'foot') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 18 Q8 10 12 8 Q16 7 17 11 Q18 15 14 17 Q10 19 8 18 Z" />
    </svg>
  )
  if (type === 'pass') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  )
  // rec
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
    </svg>
  )
}

function SectionHeading({ type, children }: { type: Parameters<typeof SectionIcon>[0]['type']; children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <SectionIcon type={type} />
      {children}
    </h2>
  )
}

export default function AnalysisReport() {
  const report = useGaitStore((s) => s.report)
  const reset = useGaitStore((s) => s.reset)

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No report available.</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 rounded-xl text-white font-bold"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    )
  }

  const { metrics, overallScore, recommendations, stepTimeline, passData, timestamp, passesCompleted } = report

  const totalStrides = ALL_PASSES.reduce(
    (s, p) => s + (passData[p]?.strideCount ?? 0),
    0
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 1. HEADER */}
      <div className="report-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-white">Your Gait Analysis Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-center">
            <span className="text-blue-400 font-bold">{passesCompleted} of 4</span>
            <span className="text-gray-500"> passes captured · </span>
            <span className="text-blue-400 font-bold">{totalStrides}</span>
            <span className="text-gray-500"> total strides</span>
          </div>
        </div>
        {passesCompleted < 4 && (
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-xl p-3 text-sm text-yellow-300 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
            </svg>
            For complete analysis, re-run and ensure all 4 passes are captured.
          </div>
        )}
      </div>

      {/* 2. OVERALL SCORE */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <SectionHeading type="score">Overall Gait Score</SectionHeading>
        <div className="flex justify-center">
          <GaitScoreGauge score={overallScore} />
        </div>
      </div>

      {/* 3. METRICS GRID */}
      <div className="report-section">
        <SectionHeading type="metrics">Gait Metrics</SectionHeading>
        <MetricsTable metrics={metrics} />

        {/* Pathological flags */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: 'Hip Drop', detected: metrics.hipDropDetected },
            { label: 'Heel Whip', detected: metrics.heelWhipDetected },
            { label: 'Scissor Gait', detected: metrics.scissorGaitDetected },
            { label: 'Left Overpronation', detected: metrics.overpronationLeft },
            { label: 'Right Overpronation', detected: metrics.overpronationRight },
            { label: 'Leg Length Discrepancy', detected: metrics.legLengthDiscrepancy },
          ].map(({ label, detected }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs ${
                detected
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-gray-900 border border-gray-800 text-gray-600'
              }`}
            >
              {detected ? (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 1.5L13 12.5H1L7 1.5Z" />
                  <line x1="7" y1="6" x2="7" y2="9" />
                  <circle cx="7" cy="11" r="0.6" fill="currentColor" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="5.5" />
                  <polyline points="4.5,7 6.5,9 9.5,5" />
                </svg>
              )}
              <span>{label}: {detected ? 'Detected' : 'None'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STEP TIMELINE */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <SectionHeading type="timeline">Step Timeline</SectionHeading>
        <StepTimelineChart data={stepTimeline} />
        <p className="text-xs text-gray-600 mt-2 text-center">
          Green = left heel · Blue = right heel · Vertical lines = heel strikes
        </p>
      </div>

      {/* 5. SYMMETRY RADAR */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <SectionHeading type="symmetry">Left vs Right Symmetry</SectionHeading>
        <SymmetryRadar metrics={metrics} />
      </div>

      {/* 6. FOOT DIAGRAMS */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <SectionHeading type="foot">Foot Analysis</SectionHeading>
        <div className="flex justify-around flex-wrap gap-8">
          <FootDiagram
            side="left"
            arch={metrics.leftArch}
            strike={metrics.leftStrikePattern}
            toeAngle={metrics.leftToeAngle}
          />
          <FootDiagram
            side="right"
            arch={metrics.rightArch}
            strike={metrics.rightStrikePattern}
            toeAngle={metrics.rightToeAngle}
          />
        </div>
      </div>

      {/* 7. PASS QUALITY SUMMARY */}
      <div className="report-section">
        <SectionHeading type="pass">Pass Quality</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALL_PASSES.map((pass) => {
            const pd = passData[pass]
            const quality = pd?.quality ?? 'poor'
            const strides = pd?.strideCount ?? 0
            const qualityColor =
              quality === 'good'
                ? 'text-green-400 border-green-500/30 bg-green-500/10'
                : quality === 'fair'
                ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                : 'text-red-400 border-red-500/30 bg-red-500/10'
            return (
              <div key={pass} className={`border rounded-xl p-3 text-center ${qualityColor}`}>
                <p className="font-semibold text-sm">{PASS_LABELS[pass]}</p>
                <p className="text-2xl font-bold my-1">{strides}</p>
                <p className="text-xs opacity-80">strides · {quality}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 8. RECOMMENDATIONS */}
      <div className="report-section">
        <SectionHeading type="rec">Recommendations</SectionHeading>
        <Recommendations recommendations={recommendations} />
      </div>

      {/* 9. FOOTER */}
      <div className="report-section space-y-4 no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Re-analyze
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Report
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            <strong className="text-gray-500">Disclaimer:</strong> GaitSense AI is not a medical device.
            Results are for informational purposes only.
            Consult a qualified healthcare professional for diagnosis or treatment.
          </p>
        </div>
      </div>
    </div>
  )
}
