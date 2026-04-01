import { QRCodeSVG } from 'qrcode.react'

export default function DesktopGate() {
  const url = window.location.href

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <circle cx="12" cy="17" r="1" fill="currentColor"/>
              <path d="M9 7h6M9 11h4"/>
            </svg>
          </div>
        </div>

        <h1 className="text-white text-3xl font-bold mb-3">Use your phone</h1>
        <p className="text-gray-400 text-base mb-8 leading-relaxed">
          Gaitsense needs your phone's camera to analyse your gait. Scan the QR code below to open the app on your phone.
        </p>

        {/* QR Code */}
        <div className="inline-block bg-white rounded-2xl p-5 mb-8 shadow-2xl">
          <QRCodeSVG
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#1e1b4b"
            level="M"
          />
        </div>

        <p className="text-gray-500 text-sm mb-2">
          Point your phone camera at the QR code
        </p>
        <p className="text-gray-600 text-xs break-all">{url}</p>

        {/* Steps */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '📱', label: 'Scan QR code' },
            { icon: '📷', label: 'Allow camera' },
            { icon: '🚶', label: 'Start walking' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
