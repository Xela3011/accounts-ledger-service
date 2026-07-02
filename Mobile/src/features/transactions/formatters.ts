import { TransactionPeriod } from './types';

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTransactionType(type: string) {
  switch (type) {
    case 'CREDIT':
    case 'Credit':
      return 'Credito';
    case 'DEBIT':
    case 'Debit':
      return 'Debito';
    default:
      return type;
  }
}

export function getPeriodStart(period: TransactionPeriod) {
  if (period === 'ALL') {
    return undefined;
  }

  const date = new Date();
  date.setDate(date.getDate() - (period === '7D' ? 7 : 30));

  return date.toISOString();
}

export function isCreditTransaction(type: string) {
  return type === 'CREDIT' || type === 'Credit';
}

export function normalizeTransactionAmount(value: string) {
  return value.trim().replace(',', '.');
}

export function isValidTransactionAmount(value: string) {
  const amount = normalizeTransactionAmount(value);

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(amount)) {
    return false;
  }

  return Number(amount) > 0;
}
