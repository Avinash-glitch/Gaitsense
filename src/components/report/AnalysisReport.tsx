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
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-xl p-3 text-sm text-yellow-300">
            ⚠ For complete analysis, re-run and ensure all 4 passes are captured.
          </div>
        )}
      </div>

      {/* 2. OVERALL SCORE */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Overall Gait Score</h2>
        <div className="flex justify-center">
          <GaitScoreGauge score={overallScore} />
        </div>
      </div>

      {/* 3. METRICS GRID */}
      <div className="report-section">
        <h2 className="text-lg font-bold text-white mb-4">Gait Metrics</h2>
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
              <span>{detected ? '⚠' : '✓'}</span>
              <span>{label}: {detected ? 'Detected' : 'None'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STEP TIMELINE */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Step Timeline</h2>
        <StepTimelineChart data={stepTimeline} />
        <p className="text-xs text-gray-600 mt-2 text-center">
          Green = left heel · Blue = right heel · Vertical lines = heel strikes
        </p>
      </div>

      {/* 5. SYMMETRY RADAR */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Left vs Right Symmetry</h2>
        <SymmetryRadar metrics={metrics} />
      </div>

      {/* 6. FOOT DIAGRAMS */}
      <div className="report-section bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Foot Analysis</h2>
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
        <h2 className="text-lg font-bold text-white mb-4">Pass Quality</h2>
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
        <h2 className="text-lg font-bold text-white mb-4">Recommendations</h2>
        <Recommendations recommendations={recommendations} />
      </div>

      {/* 9. FOOTER */}
      <div className="report-section space-y-4 no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold transition-colors"
          >
            Re-analyze
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-colors"
          >
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
