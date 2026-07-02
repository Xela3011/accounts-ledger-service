import { useEffect, useMemo, useRef, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatMoney } from '../accounts/formatters';
import {
  formatDateTime,
  formatTransactionType,
  getPeriodStart,
  isCreditTransaction,
  isValidTransactionAmount,
  normalizeTransactionAmount,
} from './formatters';
import {
  Transaction,
  TransactionFilter,
  TransactionHistoryInput,
  TransactionMode,
  TransactionPeriod,
} from './types';

type TransactionsPanelProps = {
  accountCurrency: string;
  accountId: string;
  canPostTransactions?: boolean;
  disabledReason?: string;
  onTransactionPosted?: () => Promise<unknown> | unknown;
  refreshSignal?: number;
};

type TransactionsQueryData = {
  transactions: Transaction[];
};

type TransactionsQueryVariables = {
  input: TransactionHistoryInput;
};

type PostTransactionMutationData = {
  creditAccount?: Transaction;
  debitAccount?: Transaction;
};

type PostTransactionMutationVariables = {
  input: {
    accountId: string;
    amount: string;
    description?: string | null;
  };
};

export const TRANSACTIONS_QUERY = gql`
  query AccountTransactions($input: TransactionHistoryInput) {
    transactions(input: $input) {
      id
      accountId
      amount
      type
      description
      createdAt
    }
  }
`;

export const CREDIT_ACCOUNT_MUTATION = gql`
  mutation CreditAccount($input: TransactionInput!) {
    creditAccount(input: $input) {
      id
      accountId
      amount
      type
      description
      createdAt
    }
  }
`;

export const DEBIT_ACCOUNT_MUTATION = gql`
  mutation DebitAccount($input: TransactionInput!) {
    debitAccount(input: $input) {
      id
      accountId
      amount
      type
      description
      createdAt
    }
  }
`;

const PAGE_SIZE = 10;

export function TransactionsPanel({
  accountCurrency,
  accountId,
  canPostTransactions = true,
  disabledReason = 'Esta cuenta no acepta nuevas transacciones.',
  onTransactionPosted,
  refreshSignal,
}: TransactionsPanelProps) {
  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<TransactionPeriod>('ALL');
  const [transactionMode, setTransactionMode] =
    useState<TransactionMode>('Credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const handledRefreshSignalRef = useRef(refreshSignal);

  const historyInput = useMemo<TransactionHistoryInput>(() => {
    const input: TransactionHistoryInput = {
      accountId,
      limit: PAGE_SIZE,
      offset: 0,
    };
    const from = getPeriodStart(periodFilter);

    if (transactionFilter !== 'ALL') {
      input.type = transactionFilter;
    }

    if (from) {
      input.from = from;
    }

    return input;
  }, [accountId, periodFilter, transactionFilter]);
  const filterKey = `${accountId}:${transactionFilter}:${periodFilter}`;

  const { data, error, fetchMore, loading, refetch } = useQuery<
    TransactionsQueryData,
    TransactionsQueryVariables
  >(TRANSACTIONS_QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: {
      input: historyInput,
    },
  });
  const [creditAccount, { loading: isCrediting }] = useMutation<
    PostTransactionMutationData,
    PostTransactionMutationVariables
  >(CREDIT_ACCOUNT_MUTATION);
  const [debitAccount, { loading: isDebiting }] = useMutation<
    PostTransactionMutationData,
    PostTransactionMutationVariables
  >(DEBIT_ACCOUNT_MUTATION);

  useEffect(() => {
    setHasMoreTransactions(true);
  }, [filterKey]);

  const transactions = data?.transactions ?? [];
  const isPosting = isCrediting || isDebiting;
  const canEditTransaction = canPostTransactions && !isPosting;
  const canPost =
    canPostTransactions && isValidTransactionAmount(amount) && !isPosting;

  useEffect(() => {
    if (!loading && data && transactions.length < PAGE_SIZE) {
      setHasMoreTransactions(false);
    }
  }, [data, loading, transactions.length]);

  useEffect(() => {
    if (
      refreshSignal === undefined ||
      handledRefreshSignalRef.current === refreshSignal
    ) {
      return;
    }

    handledRefreshSignalRef.current = refreshSignal;
    void refetch({ input: historyInput });
  }, [historyInput, refetch, refreshSignal]);

  async function handlePostTransaction() {
    const normalizedAmount = normalizeTransactionAmount(amount);
    const nextDescription = description.trim();

    if (!canPostTransactions) {
      setFormError(disabledReason);
      return;
    }

    if (!isValidTransactionAmount(normalizedAmount) || isPosting) {
      setFormError('Ingresa un monto mayor que cero, con hasta 4 decimales.');
      return;
    }

    setFormError(null);

    try {
      const mutation =
        transactionMode === 'Credit' ? creditAccount : debitAccount;

      await mutation({
        variables: {
          input: {
            accountId,
            amount: normalizedAmount,
            description: nextDescription.length > 0 ? nextDescription : null,
          },
        },
      });

      setAmount('');
      setDescription('');
      setHasMoreTransactions(true);
      await refetch({ input: historyInput });
      await onTransactionPosted?.();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error &&
        mutationError.message.includes('Insufficient funds')
          ? 'Fondos insuficientes para completar el debito.'
          : 'No se pudo registrar la transaccion. Intentalo de nuevo.';

      setFormError(message);
    }
  }

  async function handleLoadMoreTransactions() {
    if (isLoadingMore || loading || !hasMoreTransactions) {
      return;
    }

    setIsLoadingMore(true);
    let fetchedCount = 0;

    try {
      await fetchMore({
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const nextTransactions = fetchMoreResult.transactions ?? [];
          fetchedCount = nextTransactions.length;

          return {
            transactions: [
              ...(previousResult.transactions ?? []),
              ...nextTransactions,
            ],
          };
        },
        variables: {
          input: {
            ...historyInput,
            offset: transactions.length,
          },
        },
      });

      setHasMoreTransactions(fetchedCount === PAGE_SIZE);
    } catch {
      setHasMoreTransactions(false);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <View>
      <View style={styles.transactionPanel}>
        <Text style={styles.sectionTitle}>Nueva transacción</Text>
        {!canPostTransactions ? (
          <Text style={styles.statusNotice}>{disabledReason}</Text>
        ) : null}
        <View style={styles.segmentedControl}>
          <SegmentButton
            active={transactionMode === 'Credit'}
            disabled={!canPostTransactions}
            label="Credito"
            onPress={() => {
              setTransactionMode('Credit');
              setFormError(null);
            }}
          />
          <SegmentButton
            active={transactionMode === 'Debit'}
            disabled={!canPostTransactions}
            label="Debito"
            onPress={() => {
              setTransactionMode('Debit');
              setFormError(null);
            }}
          />
        </View>
        <TextInput
          editable={canEditTransaction}
          keyboardType="decimal-pad"
          onChangeText={(value) => {
            setAmount(value);
            setFormError(null);
          }}
          placeholder="Monto"
          placeholderTextColor="#8A94A6"
          style={styles.amountInput}
          value={amount}
        />
        <TextInput
          editable={canEditTransaction}
          maxLength={255}
          onChangeText={setDescription}
          placeholder="Descripcion opcional"
          placeholderTextColor="#8A94A6"
          style={styles.descriptionInput}
          value={description}
        />
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!canPost}
          onPress={() => void handlePostTransaction()}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.postButton,
            !canPost && styles.primaryButtonDisabled,
            pressed && canPost && styles.primaryButtonPressed,
          ]}
        >
          {isPosting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Registrar {transactionMode === 'Credit' ? 'crédito' : 'débito'}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {loading && data ? (
          <ActivityIndicator color="#4ab8ff" size="small" />
        ) : null}
      </View>
      <View style={styles.filterGroup}>
        <View style={styles.segmentedControl}>
          <SegmentButton
            active={transactionFilter === 'ALL'}
            label="Todos"
            onPress={() => setTransactionFilter('ALL')}
          />
          <SegmentButton
            active={transactionFilter === 'Credit'}
            label="Creditos"
            onPress={() => setTransactionFilter('Credit')}
          />
          <SegmentButton
            active={transactionFilter === 'Debit'}
            label="Debitos"
            onPress={() => setTransactionFilter('Debit')}
          />
        </View>
        <View style={styles.segmentedControl}>
          <SegmentButton
            active={periodFilter === 'ALL'}
            label="Todo"
            onPress={() => setPeriodFilter('ALL')}
          />
          <SegmentButton
            active={periodFilter === '7D'}
            label="7 dias"
            onPress={() => setPeriodFilter('7D')}
          />
          <SegmentButton
            active={periodFilter === '30D'}
            label="30 dias"
            onPress={() => setPeriodFilter('30D')}
          />
        </View>
      </View>

      <TransactionList
        accountCurrency={accountCurrency}
        hasError={!!error}
        hasMore={hasMoreTransactions}
        isLoading={loading && !data}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => void handleLoadMoreTransactions()}
        onRetry={() => void refetch()}
        transactions={transactions}
      />
    </View>
  );
}

function SegmentButton({
  active,
  disabled = false,
  label,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active && styles.segmentButtonActive,
        disabled && styles.segmentButtonDisabled,
        pressed && !disabled && styles.segmentButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.segmentButtonText,
          active && styles.segmentButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TransactionList({
  accountCurrency,
  hasError,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRetry,
  transactions,
}: {
  accountCurrency: string;
  hasError: boolean;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  transactions: Transaction[];
}) {
  if (isLoading) {
    return (
      <View style={styles.historyState}>
        <ActivityIndicator color="#4ab8ff" />
        <Text style={styles.historyStateText}>Cargando transacciones</Text>
      </View>
    );
  }

  if (hasError && transactions.length === 0) {
    return (
      <View style={styles.historyState}>
        <Text style={styles.emptyTitle}>Historial no disponible</Text>
        <Text style={styles.emptyMessage}>
          No pudimos cargar estas transacciones.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.loadMoreButton,
            pressed && styles.loadMoreButtonPressed,
          ]}
        >
          <Text style={styles.loadMoreButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.historyState}>
        <Text style={styles.emptyTitle}>Sin movimientos</Text>
        <Text style={styles.emptyMessage}>
          No hay transacciones para estos filtros.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.transactionList}>
      {transactions.map((transaction) => (
        <TransactionRow
          accountCurrency={accountCurrency}
          key={transaction.id}
          transaction={transaction}
        />
      ))}
      {hasMore ? (
        <Pressable
          accessibilityRole="button"
          disabled={isLoadingMore}
          onPress={onLoadMore}
          style={({ pressed }) => [
            styles.loadMoreButton,
            pressed && !isLoadingMore && styles.loadMoreButtonPressed,
          ]}
        >
          {isLoadingMore ? (
            <ActivityIndicator color="#003b72" />
          ) : (
            <Text style={styles.loadMoreButtonText}>Cargar más</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function TransactionRow({
  accountCurrency,
  transaction,
}: {
  accountCurrency: string;
  transaction: Transaction;
}) {
  const isCredit = isCreditTransaction(transaction.type);
  const amountPrefix = isCredit ? '+' : '-';

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>
          {transaction.description || formatTransactionType(transaction.type)}
        </Text>
        <Text style={styles.transactionMeta}>
          {formatTransactionType(transaction.type)} -{' '}
          {formatDateTime(transaction.createdAt)}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          isCredit ? styles.creditAmount : styles.debitAmount,
        ]}
      >
        {amountPrefix}
        {formatMoney(transaction.amount, accountCurrency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    height: 48,
    letterSpacing: 0,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  creditAmount: {
    color: '#027A48',
  },
  debitAmount: {
    color: '#B42318',
  },
  descriptionInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    height: 48,
    letterSpacing: 0,
    marginTop: 10,
    paddingHorizontal: 14,
  },
  emptyMessage: {
    color: '#5C6675',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  filterGroup: {
    gap: 10,
    marginTop: 12,
  },
  formError: {
    color: '#B42318',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 10,
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  historyState: {
    alignItems: 'center',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 12,
    padding: 24,
  },
  historyStateText: {
    color: '#4B5563',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 10,
  },
  loadMoreButton: {
    alignItems: 'center',
    borderColor: '#003b72',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginTop: 12,
    minWidth: 128,
    paddingHorizontal: 16,
  },
  loadMoreButtonPressed: {
    backgroundColor: '#E8F6FF',
  },
  loadMoreButtonText: {
    color: '#003b72',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  postButton: {
    marginTop: 14,
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
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  segmentButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#003b72',
    borderColor: '#003b72',
  },
  segmentButtonDisabled: {
    opacity: 0.55,
  },
  segmentButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  segmentButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  statusNotice: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 8,
  },
  transactionAmount: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right',
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionList: {
    marginTop: 12,
  },
  transactionMeta: {
    color: '#5C6675',
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 17,
    marginTop: 4,
  },
  transactionPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  transactionRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  transactionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
