import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
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
import {
  formatAccountStatus,
  formatDate,
  formatMoney,
  isActiveAccountStatus,
  isClosedAccountStatus,
  isFrozenAccountStatus,
} from './formatters';
import { Account } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetails'>;

type AccountDetailsQueryData = {
  account: Account;
  balance: string;
};

type AccountDetailsQueryVariables = {
  id: string;
};

type AccountStatusMutationData = {
  account: Account;
};

type AccountStatusMutationVariables = {
  id: string;
};

type PendingStatusAction = 'freeze' | 'cancel';

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

const ACCOUNT_STATUS_FIELDS = gql`
  fragment AccountStatusFields on Account {
    id
    accountNumber
    currency
    balance
    status
    createdAt
    updatedAt
  }
`;

export const FREEZE_ACCOUNT_MUTATION = gql`
  ${ACCOUNT_STATUS_FIELDS}
  mutation FreezeAccount($id: ID!) {
    account: freezeAccount(id: $id) {
      ...AccountStatusFields
    }
  }
`;

export const UNFREEZE_ACCOUNT_MUTATION = gql`
  ${ACCOUNT_STATUS_FIELDS}
  mutation UnfreezeAccount($id: ID!) {
    account: unfreezeAccount(id: $id) {
      ...AccountStatusFields
    }
  }
`;

export const CANCEL_ACCOUNT_MUTATION = gql`
  ${ACCOUNT_STATUS_FIELDS}
  mutation CancelAccount($id: ID!) {
    account: cancelAccount(id: $id) {
      ...AccountStatusFields
    }
  }
`;

export function AccountDetailsScreen({ navigation, route }: Props) {
  const [transactionsRefreshSignal, setTransactionsRefreshSignal] = useState(0);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusAction, setPendingStatusAction] =
    useState<PendingStatusAction | null>(null);
  const { data, error, loading, refetch } = useQuery<
    AccountDetailsQueryData,
    AccountDetailsQueryVariables
  >(ACCOUNT_DETAILS_QUERY, {
    variables: {
      id: route.params.accountId,
    },
  });
  const [freezeAccount, { loading: isFreezing }] = useMutation<
    AccountStatusMutationData,
    AccountStatusMutationVariables
  >(FREEZE_ACCOUNT_MUTATION);
  const [unfreezeAccount, { loading: isUnfreezing }] = useMutation<
    AccountStatusMutationData,
    AccountStatusMutationVariables
  >(UNFREEZE_ACCOUNT_MUTATION);
  const [cancelAccount, { loading: isCanceling }] = useMutation<
    AccountStatusMutationData,
    AccountStatusMutationVariables
  >(CANCEL_ACCOUNT_MUTATION);

  const account = data?.account;
  const currentBalance = data?.balance ?? account?.balance;
  const isUpdatingStatus = isFreezing || isUnfreezing || isCanceling;

  async function handleRefresh() {
    await refetch();
    setTransactionsRefreshSignal((currentValue) => currentValue + 1);
  }

  async function handleStatusUpdate(
    mutation: (options: {
      variables: AccountStatusMutationVariables;
    }) => Promise<unknown>,
  ) {
    if (!account || isUpdatingStatus) {
      return;
    }

    setStatusError(null);

    try {
      await mutation({
        variables: {
          id: account.id,
        },
      });
      await refetch();
    } catch {
      setStatusError('No se pudo actualizar el estado de la cuenta.');
    }
  }

  function confirmFreezeAccount() {
    setPendingStatusAction('freeze');
  }

  function confirmCancelAccount() {
    setPendingStatusAction('cancel');
  }

  function dismissStatusConfirmation() {
    if (!isUpdatingStatus) {
      setPendingStatusAction(null);
    }
  }

  function handleConfirmedStatusAction() {
    const nextAction = pendingStatusAction;

    setPendingStatusAction(null);

    if (nextAction === 'freeze') {
      void handleStatusUpdate(freezeAccount);
      return;
    }

    if (nextAction === 'cancel') {
      void handleStatusUpdate(cancelAccount);
    }
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
  const isActive = isActiveAccountStatus(account.status);
  const isFrozen = isFrozenAccountStatus(account.status);
  const isClosed = isClosedAccountStatus(account.status);
  const transactionDisabledReason = isClosed
    ? 'Esta cuenta esta cancelada y no acepta nuevas transacciones.'
    : 'Esta cuenta esta congelada y no acepta nuevas transacciones.';
  const statusConfirmation =
    pendingStatusAction === 'freeze'
      ? {
          confirmLabel: 'Si, congelar',
          message:
            'La cuenta no aceptara nuevas transacciones mientras este congelada.',
          title: 'Congelar cuenta',
        }
      : pendingStatusAction === 'cancel'
        ? {
            confirmLabel: 'Si, cancelar',
            message:
              'Esta accion no se puede deshacer. La cuenta cancelada no aceptara nuevas transacciones.',
            title: 'Cancelar cuenta',
          }
        : null;

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

        <View style={styles.actionsPanel}>
          <Text style={styles.sectionTitle}>Estado de cuenta</Text>
          <View style={styles.actionsRow}>
            {isFrozen ? (
              <StatusButton
                disabled={isUpdatingStatus || isClosed}
                label={isUnfreezing ? 'Actualizando' : 'Descongelar'}
                onPress={() => void handleStatusUpdate(unfreezeAccount)}
              />
            ) : (
              <StatusButton
                disabled={isUpdatingStatus || isClosed}
                label={isFreezing ? 'Actualizando' : 'Congelar'}
                onPress={confirmFreezeAccount}
              />
            )}
            <StatusButton
              danger
              disabled={isUpdatingStatus || isClosed}
              label={isCanceling ? 'Actualizando' : 'Cancelar'}
              onPress={confirmCancelAccount}
            />
          </View>
          {statusError ? (
            <Text style={styles.formError}>{statusError}</Text>
          ) : null}
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
          canPostTransactions={isActive}
          disabledReason={transactionDisabledReason}
          onTransactionPosted={() => refetch()}
          refreshSignal={transactionsRefreshSignal}
        />
      </ScrollView>

      {statusConfirmation ? (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationPanel}>
            <Text style={styles.confirmationTitle}>
              {statusConfirmation.title}
            </Text>
            <Text style={styles.confirmationMessage}>
              {statusConfirmation.message}
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isUpdatingStatus}
                onPress={dismissStatusConfirmation}
                style={({ pressed }) => [
                  styles.confirmationSecondaryButton,
                  pressed &&
                    !isUpdatingStatus &&
                    styles.confirmationSecondaryButtonPressed,
                ]}
              >
                <Text style={styles.confirmationSecondaryButtonText}>
                  No, mantener
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isUpdatingStatus}
                onPress={handleConfirmedStatusAction}
                style={({ pressed }) => [
                  styles.confirmationDangerButton,
                  isUpdatingStatus && styles.statusActionButtonDisabled,
                  pressed &&
                    !isUpdatingStatus &&
                    styles.confirmationDangerButtonPressed,
                ]}
              >
                <Text style={styles.confirmationDangerButtonText}>
                  {statusConfirmation.confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function StatusButton({
  danger = false,
  disabled,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusActionButton,
        danger && styles.statusActionButtonDanger,
        disabled && styles.statusActionButtonDisabled,
        pressed && !disabled && styles.statusActionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.statusActionButtonText,
          danger && styles.statusActionButtonDangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  actionsPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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
  confirmationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmationDangerButton: {
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 8,
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmationDangerButtonPressed: {
    backgroundColor: '#8F1D14',
  },
  confirmationDangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  confirmationMessage: {
    color: '#4B5563',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 8,
  },
  confirmationOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  confirmationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxWidth: 420,
    padding: 18,
    width: '100%',
  },
  confirmationSecondaryButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmationSecondaryButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  confirmationSecondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  confirmationTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
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
  formError: {
    color: '#B42318',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 10,
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
  statusActionButton: {
    alignItems: 'center',
    borderColor: '#003b72',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusActionButtonDanger: {
    borderColor: '#B42318',
  },
  statusActionButtonDangerText: {
    color: '#B42318',
  },
  statusActionButtonDisabled: {
    opacity: 0.45,
  },
  statusActionButtonPressed: {
    backgroundColor: '#E8F6FF',
  },
  statusActionButtonText: {
    color: '#003b72',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
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
