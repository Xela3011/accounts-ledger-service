import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../../features/home/HomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: '#F6F8FA' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Qik Ledger' }}
      />
    </Stack.Navigator>
  );
}
