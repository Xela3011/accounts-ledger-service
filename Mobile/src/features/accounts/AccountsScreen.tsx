import { useMemo, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../application/navigation/types';
import { useAuth } from '../auth/AuthContext';
import {
  formatAccountStatus,
  formatDate,
  formatMoney,
  normalizeCurrency,
} from './formatters';
import { Account } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type AccountsQueryData = {
  accounts: Account[];
};

type CreateAccountMutationData = {
  createAccount: Account;
};

type CreateAccountMutationVariables = {
  input: {
    currency: string;
  };
};

const ACCOUNT_FIELDS = gql`
  fragment AccountFields on Account {
    id
    accountNumber
    currency
    balance
    status
    createdAt
    updatedAt
  }
`;

export const ACCOUNTS_QUERY = gql`
  ${ACCOUNT_FIELDS}
  query Accounts {
    accounts {
      ...AccountFields
    }
  }
`;

const CREATE_ACCOUNT_MUTATION = gql`
  ${ACCOUNT_FIELDS}
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      ...AccountFields
    }
  }
`;

export function AccountsScreen({ navigation }: Props) {
  const { logout, user } = useAuth();
  const [currency, setCurrency] = useState('DOP');
  const [formError, setFormError] = useState<string | null>(null);
  const { data, error, loading, refetch } =
    useQuery<AccountsQueryData>(ACCOUNTS_QUERY);
  const [createAccount, { loading: isCreating }] = useMutation<
    CreateAccountMutationData,
    CreateAccountMutationVariables
  >(CREATE_ACCOUNT_MUTATION);

  const accounts = useMemo(() => data?.accounts ?? [], [data?.accounts]);
  const displayName = user?.name ?? user?.email ?? 'Usuario autenticado';
  const totalBalance = useMemo(
    () =>
      accounts.reduce((sum, account) => {
        const balance = Number(account.balance);

        return Number.isFinite(balance) ? sum + balance : sum;
      }, 0),
    [accounts],
  );
  const canCreate =
    /^[A-Z]{3}$/.test(normalizeCurrency(currency)) && !isCreating;

  async function handleCreateAccount() {
    const nextCurrency = normalizeCurrency(currency);

    if (!/^[A-Z]{3}$/.test(nextCurrency) || isCreating) {
      setFormError('Usa un codigo de moneda de tres letras.');
      return;
    }

    setFormError(null);

    try {
      await createAccount({
        refetchQueries: [{ query: ACCOUNTS_QUERY }],
        variables: {
          input: {
            currency: nextCurrency,
          },
        },
      });
      setCurrency(nextCurrency);
    } catch {
      setFormError('No se pudo crear la cuenta. Intentalo de nuevo.');
    }
  }

  function renderAccount({ item }: { item: Account }) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('AccountDetails', {
            accountId: item.id,
            accountNumber: item.accountNumber,
          })
        }
        style={({ pressed }) => [
          styles.accountCard,
          pressed && styles.accountCardPressed,
        ]}
      >
        <View style={styles.accountCardHeader}>
          <View style={styles.accountIdentity}>
            <Text numberOfLines={1} style={styles.accountNumber}>
              {item.accountNumber}
            </Text>
            <Text style={styles.accountMeta}>
              Cuenta {item.currency} - Apertura {formatDate(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.statusBadge}>
            {formatAccountStatus(item.status)}
          </Text>
        </View>
        <Text style={styles.accountBalance}>
          {formatMoney(item.balance, item.currency)}
        </Text>
      </Pressable>
    );
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#4ab8ff" size="large" />
          <Text style={styles.centerStateText}>Cargando cuentas</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Cuentas no disponibles</Text>
          <Text style={styles.errorMessage}>
            No pudimos cargar tus cuentas en este momento.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={accounts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aun no tienes cuentas</Text>
            <Text style={styles.emptyMessage}>
              Crea una cuenta para empezar a ver tus saldos.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.eyebrow}>Cuentas y transacciones</Text>
                <Text style={styles.title}>Hola, {displayName}</Text>
              </View>
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

            <View style={styles.balancePanel}>
              <Text style={styles.panelLabel}>Saldo total</Text>
              <Text style={styles.totalBalance}>
                {formatMoney(
                  totalBalance.toFixed(4),
                  accounts[0]?.currency ?? 'DOP',
                )}
              </Text>
              <Text style={styles.panelHint}>
                {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
              </Text>
            </View>

            <View style={styles.createPanel}>
              <Text style={styles.sectionTitle}>Crear cuenta</Text>
              <View style={styles.createRow}>
                <TextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isCreating}
                  maxLength={3}
                  onChangeText={(value) => {
                    setCurrency(value);
                    setFormError(null);
                  }}
                  placeholder="DOP"
                  placeholderTextColor="#8A94A6"
                  style={styles.currencyInput}
                  value={currency}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canCreate}
                  onPress={() => void handleCreateAccount()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.createButton,
                    !canCreate && styles.primaryButtonDisabled,
                    pressed && canCreate && styles.primaryButtonPressed,
                  ]}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Crear</Text>
                  )}
                </Pressable>
              </View>
              {formError ? (
                <Text style={styles.formError}>{formError}</Text>
              ) : null}
              {error ? (
                <Text style={styles.inlineError}>
                  No se pudo actualizar la lista. Desliza hacia abajo para
                  reintentar.
                </Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Cuentas</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            tintColor="#4ab8ff"
            onRefresh={() => void refetch()}
          />
        }
        renderItem={renderAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accountBalance: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 18,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  accountCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  accountCardPressed: {
    borderColor: '#4ab8ff',
    transform: [{ scale: 0.99 }],
  },
  accountIdentity: {
    flex: 1,
    minWidth: 0,
  },
  accountMeta: {
    color: '#5C6675',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 4,
  },
  accountNumber: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  balancePanel: {
    backgroundColor: '#003b72',
    borderRadius: 8,
    marginTop: 22,
    padding: 18,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerStateText: {
    color: '#4B5563',
    fontSize: 15,
    letterSpacing: 0,
    marginTop: 14,
  },
  createButton: {
    minWidth: 104,
  },
  createPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  createRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  currencyInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    height: 48,
    letterSpacing: 0,
    paddingHorizontal: 14,
  },
  emptyMessage: {
    color: '#5C6675',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#5C6675',
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#B42318',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  eyebrow: {
    color: '#003b72',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  formError: {
    color: '#B42318',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 10,
  },
  header: {
    marginBottom: 14,
  },
  inlineError: {
    color: '#B42318',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 36,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#003b72',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  logoutButtonPressed: {
    backgroundColor: '#002c55',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  panelHint: {
    color: '#D9F2FF',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 8,
  },
  panelLabel: {
    color: '#D9F2FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#003b72',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonPressed: {
    backgroundColor: '#002c55',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  safeArea: {
    backgroundColor: '#F6F8FA',
    flex: 1,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 20,
  },
  statusBadge: {
    backgroundColor: '#E8F6FF',
    borderRadius: 8,
    color: '#003b72',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  totalBalance: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
