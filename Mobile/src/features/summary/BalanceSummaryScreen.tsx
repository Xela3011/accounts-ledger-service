import { useMemo } from 'react';
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
import {
  formatAccountStatus,
  formatDate,
  formatMoney,
} from '../accounts/formatters';
import { Account } from '../accounts/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BalanceSummary'>;

type BalanceSummary = {
  accountId: string;
  currentBalance: string;
  totalCredits: string;
  totalDebits: string;
};

type BalanceSummaryQueryData = {
  account: Account;
  balanceSummary: BalanceSummary;
};

type BalanceSummaryQueryVariables = {
  accountId: string;
};

export const BALANCE_SUMMARY_QUERY = gql`
  query BalanceSummary($accountId: ID!) {
    account(id: $accountId) {
      id
      accountNumber
      currency
      balance
      status
      createdAt
      updatedAt
    }
    balanceSummary(accountId: $accountId) {
      accountId
      currentBalance
      totalCredits
      totalDebits
    }
  }
`;

export function BalanceSummaryScreen({ route }: Props) {
  const { data, error, loading, refetch } = useQuery<
    BalanceSummaryQueryData,
    BalanceSummaryQueryVariables
  >(BALANCE_SUMMARY_QUERY, {
    variables: {
      accountId: route.params.accountId,
    },
  });

  const account = data?.account;
  const summary = data?.balanceSummary;
  const totals = useMemo(() => {
    const credits = Number(summary?.totalCredits ?? 0);
    const debits = Number(summary?.totalDebits ?? 0);
    const safeCredits = Number.isFinite(credits) ? credits : 0;
    const safeDebits = Number.isFinite(debits) ? debits : 0;
    const movement = safeCredits + safeDebits;
    const creditShare = movement > 0 ? safeCredits / movement : 0;
    const debitShare = movement > 0 ? safeDebits / movement : 0;

    return {
      creditShare,
      debitShare,
      netFlow: safeCredits - safeDebits,
    };
  }, [summary?.totalCredits, summary?.totalDebits]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#4ab8ff" size="large" />
          <Text style={styles.centerStateText}>Cargando resumen</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Resumen no disponible</Text>
          <Text style={styles.errorMessage}>
            No pudimos cargar el resumen de esta cuenta.
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

  if (!account || !summary) {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            tintColor="#4ab8ff"
            onRefresh={() => void refetch()}
          />
        }
      >
        <Text style={styles.eyebrow}>Resumen de balance</Text>
        <Text numberOfLines={2} style={styles.title}>
          {account.accountNumber}
        </Text>

        <View style={styles.balancePanel}>
          <View style={styles.balanceHeader}>
            <Text style={styles.panelLabel}>Saldo actual</Text>
            <Text style={styles.statusBadge}>
              {formatAccountStatus(account.status)}
            </Text>
          </View>
          <Text style={styles.balanceValue}>
            {formatMoney(summary.currentBalance, account.currency)}
          </Text>
          {error ? (
            <Text style={styles.inlineError}>
              No se pudo actualizar el resumen. Desliza hacia abajo para
              reintentar.
            </Text>
          ) : null}
        </View>

        <View style={styles.metricsGrid}>
          <MetricBlock
            label="Créditos"
            tone="credit"
            value={formatMoney(summary.totalCredits, account.currency)}
          />
          <MetricBlock
            label="Débitos"
            tone="debit"
            value={formatMoney(summary.totalDebits, account.currency)}
          />
        </View>

        <View style={styles.flowPanel}>
          <Text style={styles.sectionTitle}>Actividad neta</Text>
          <Text
            style={[
              styles.netValue,
              totals.netFlow >= 0 ? styles.creditText : styles.debitText,
            ]}
          >
            {formatMoney(totals.netFlow.toFixed(4), account.currency)}
          </Text>
          <View style={styles.flowTrack}>
            <View
              style={[styles.creditBar, { flex: totals.creditShare || 0.0001 }]}
            />
            <View
              style={[styles.debitBar, { flex: totals.debitShare || 0.0001 }]}
            />
          </View>
          <View style={styles.legendRow}>
            <LegendItem color="#027A48" label="Creditos" />
            <LegendItem color="#B42318" label="Debitos" />
          </View>
        </View>

        <View style={styles.detailPanel}>
          <SummaryRow label="Moneda" value={account.currency} />
          <SummaryRow label="Apertura" value={formatDate(account.createdAt)} />
          <SummaryRow
            label="Actualizada"
            value={formatDate(account.updatedAt)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricBlock({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'credit' | 'debit';
  value: string;
}) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[
          styles.metricValue,
          tone === 'credit' ? styles.creditText : styles.debitText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  balancePanel: {
    backgroundColor: '#003b72',
    borderRadius: 8,
    marginTop: 22,
    padding: 18,
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
  creditBar: {
    backgroundColor: '#027A48',
  },
  creditText: {
    color: '#027A48',
  },
  debitBar: {
    backgroundColor: '#B42318',
  },
  debitText: {
    color: '#B42318',
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
  flowPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  flowTrack: {
    backgroundColor: '#E5EAF0',
    borderRadius: 8,
    flexDirection: 'row',
    height: 12,
    marginTop: 14,
    overflow: 'hidden',
  },
  inlineError: {
    color: '#FED7D7',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 12,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  legendLabel: {
    color: '#5C6675',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  legendSwatch: {
    borderRadius: 4,
    height: 10,
    width: 10,
  },
  metricBlock: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: 14,
  },
  metricLabel: {
    color: '#5C6675',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  netValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 12,
  },
  panelLabel: {
    color: '#D9F2FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
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
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
