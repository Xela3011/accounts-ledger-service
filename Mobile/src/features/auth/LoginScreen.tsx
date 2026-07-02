import { FormEvent, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event?: FormEvent) {
    event?.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch {
      setError('Correo o contrasena incorrectos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    email.trim().length > 0 && password.length >= 8 && !isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Cuentas y ledger</Text>
          <Text style={styles.title}>Qik Ledger</Text>
          <Text style={styles.subtitle}>Inicia sesion para continuar.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSubmitting}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="nombre@ejemplo.com"
              placeholderTextColor="#8A94A6"
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!isSubmitting}
              onChangeText={setPassword}
              onSubmitEditing={() => void handleLogin()}
              placeholder="Minimo 8 caracteres"
              placeholderTextColor="#8A94A6"
              returnKeyType="go"
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => void handleLogin()}
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#003b72',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonPressed: {
    backgroundColor: '#002c55',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
  eyebrow: {
    color: '#003b72',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  field: {
    gap: 8,
  },
  form: {
    gap: 16,
  },
  header: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    height: 52,
    letterSpacing: 0,
    paddingHorizontal: 14,
  },
  label: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  safeArea: {
    backgroundColor: '#F6F8FA',
    flex: 1,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
  },
});
