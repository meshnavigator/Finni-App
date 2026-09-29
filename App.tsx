import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppRoot from './src/ui/AppRoot.tsx';

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><AppRoot /></SafeAreaProvider>;
}
