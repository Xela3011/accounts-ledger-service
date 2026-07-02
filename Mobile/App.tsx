import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './src/application/AppProviders';
import { RootNavigator } from './src/application/navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
      <StatusBar style="auto" />
    </AppProviders>
  );
}
