import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../../features/auth/LoginScreen';
import { useAuth } from '../../features/auth/AuthContext';
import { HomeScreen } from '../../features/home/HomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#256D5A" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: '#F6F8FA' },
        headerTitleAlign: 'center',
      }}
    >
      {status === 'authenticated' ? (
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Qik Ledger' }}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    flex: 1,
    justifyContent: 'center',
  },
});
