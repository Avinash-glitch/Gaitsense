import { useGaitStore } from './store/gaitStore'
import Header from './components/layout/Header'
import AppShell from './components/layout/AppShell'
import WelcomeScreen from './components/setup/WelcomeScreen'
import CameraSetup from './components/setup/CameraSetup'
import ProtocolExplainer from './components/setup/ProtocolExplainer'
import VideoCapture from './components/recording/VideoCapture'
import AnalysisReport from './components/report/AnalysisReport'

export default function App() {
  const currentScreen = useGaitStore((s) => s.currentScreen)

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />
      case 'camera_setup':
        return <CameraSetup />
      case 'protocol':
        return <ProtocolExplainer />
      case 'recording':
        return <VideoCapture />
      case 'report':
        return <AnalysisReport />
      default:
        return <WelcomeScreen />
    }
  }

  return (
    <div className="dark">
      <Header />
      <AppShell>{renderScreen()}</AppShell>
    </div>
  )
}
