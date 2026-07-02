import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GRAPHQL_URL } from '../../config/environment';
import { useAuth } from '../auth/AuthContext';

export function HomeScreen() {
  const { logout, user } = useAuth();
  const displayName = user?.name ?? user?.email ?? 'Usuario autenticado';

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Cuentas y ledger</Text>
      <Text style={styles.title}>Hola, {displayName}</Text>
      <Text style={styles.description}>GraphQL endpoint: {GRAPHQL_URL}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void logout()}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
      >
        <Text style={styles.logoutButtonText}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F6F8FA',
  },
  eyebrow: {
    color: '#003b72',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 12,
  },
  description: {
    color: '#4B5563',
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#003b72',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  logoutButtonPressed: {
    backgroundColor: '#002c55',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
