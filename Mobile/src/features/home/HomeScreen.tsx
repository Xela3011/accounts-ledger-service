import { StyleSheet, Text, View } from 'react-native';

import { GRAPHQL_URL } from '../../config/environment';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Accounts & Ledger</Text>
      <Text style={styles.title}>Mobile setup is ready</Text>
      <Text style={styles.description}>GraphQL endpoint: {GRAPHQL_URL}</Text>
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
    color: '#32746D',
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
    lineHeight: 22,
  },
});
