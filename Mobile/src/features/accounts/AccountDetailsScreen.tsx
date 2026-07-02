import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../application/navigation/types';
import { TransactionsPanel } from '../transactions/TransactionsPanel';
import { formatAccountStatus, formatDate, formatMoney } from './formatters';
import { Account } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetails'>;

type AccountDetailsQueryData = {
  account: Account;
  balance: string;
};

type AccountDetailsQueryVariables = {
  id: string;
};

export const ACCOUNT_DETAILS_QUERY = gql`
  query AccountDetails($id: ID!) {
    account(id: $id) {
      id
      accountNumber
      currency
      balance
      status
      createdAt
      updatedAt
    }
    balance(accountId: $id)
  }
`;

export function AccountDetailsScreen({ navigation, route }: Props) {
  const [transactionsRefreshSignal, setTransactionsRefreshSignal] = useState(0);
  const { data, error, loading, refetch } = useQuery<
    AccountDetailsQueryData,
    AccountDetailsQueryVariables
  >(ACCOUNT_DETAILS_QUERY, {
    variables: {
      id: route.params.accountId,
    },
  });

  const account = data?.account;
  const currentBalance = data?.balance ?? account?.balance;

  async function handleRefresh() {
    await refetch();
    setTransactionsRefreshSignal((currentValue) => currentValue + 1);
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#4ab8ff" size="large" />
          <Text style={styles.centerStateText}>Cargando cuenta</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Cuenta no disponible</Text>
          <Text style={styles.errorMessage}>
            No pudimos cargar esta cuenta en este momento.
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

  if (!account) {
    return null;
  }

  const displayedBalance = currentBalance ?? account.balance;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            tintColor="#4ab8ff"
            onRefresh={() => void handleRefresh()}
          />
        }
      >
        <Text style={styles.eyebrow}>Detalle de cuenta</Text>
        <Text numberOfLines={2} style={styles.title}>
          {account.accountNumber}
        </Text>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo actual</Text>
            <Text style={styles.statusBadge}>
              {formatAccountStatus(account.status)}
            </Text>
          </View>
          <Text style={styles.balanceValue}>
            {formatMoney(displayedBalance, account.currency)}
          </Text>
          {error ? (
            <Text style={styles.inlineError}>
              No se pudo actualizar el saldo. Desliza hacia abajo para
              reintentar.
            </Text>
          ) : null}
        </View>

        <View style={styles.detailPanel}>
          <DetailRow label="Moneda" value={account.currency} />
          <DetailRow label="Apertura" value={formatDate(account.createdAt)} />
          <DetailRow
            label="Actualizada"
            value={formatDate(account.updatedAt)}
          />
          <DetailRow label="ID de cuenta" value={account.id} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('BalanceSummary', {
              accountId: account.id,
              accountNumber: account.accountNumber,
            })
          }
          style={({ pressed }) => [
            styles.summaryButton,
            pressed && styles.summaryButtonPressed,
          ]}
        >
          <Text style={styles.summaryButtonText}>Ver resumen</Text>
        </Pressable>

        <TransactionsPanel
          accountCurrency={account.currency}
          accountId={account.id}
          onTransactionPosted={() => refetch()}
          refreshSignal={transactionsRefreshSignal}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#003b72',
    borderRadius: 8,
    marginTop: 22,
    padding: 18,
  },
  balanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#D9F2FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 14,
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
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  detailLabel: {
    color: '#5C6675',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  detailPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    borderBottomColor: '#E5EAF0',
    borderBottomWidth: 1,
    gap: 6,
    paddingVertical: 16,
  },
  detailValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 21,
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
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inlineError: {
    color: '#FED7D7',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#003b72',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
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
  summaryButton: {
    alignItems: 'center',
    borderColor: '#003b72',
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
  },
  summaryButtonPressed: {
    backgroundColor: '#E8F6FF',
  },
  summaryButtonText: {
    color: '#003b72',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: '#111827',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
