import AppRoot from './src/ui/AppRoot.tsx';
import { HomeSceneSpikeFoxDiagnostic } from './src/ui/HomeSceneSpikeFoxDiagnostic';

export default function App() {
  if (process.env.EXPO_PUBLIC_FINNI_3D_DIAGNOSTIC === '1') {
    return <HomeSceneSpikeFoxDiagnostic />;
  }
  return <AppRoot />;
}