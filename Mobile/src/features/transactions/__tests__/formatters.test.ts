import {
  formatTransactionType,
  getPeriodStart,
  isCreditTransaction,
  isValidTransactionAmount,
  normalizeTransactionAmount,
} from '../formatters';

describe('transaction formatters', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats transaction types from GraphQL and backend enum casing', () => {
    expect(formatTransactionType('Credit')).toBe('Credito');
    expect(formatTransactionType('CREDIT')).toBe('Credito');
    expect(formatTransactionType('Debit')).toBe('Debito');
    expect(formatTransactionType('DEBIT')).toBe('Debito');
    expect(formatTransactionType('Unknown')).toBe('Unknown');
  });

  it('detects credit transactions across supported enum casing', () => {
    expect(isCreditTransaction('Credit')).toBe(true);
    expect(isCreditTransaction('CREDIT')).toBe(true);
    expect(isCreditTransaction('Debit')).toBe(false);
  });

  it('normalizes and validates transaction amounts', () => {
    expect(normalizeTransactionAmount(' 10,25 ')).toBe('10.25');
    expect(isValidTransactionAmount('10')).toBe(true);
    expect(isValidTransactionAmount('10.1234')).toBe(true);
    expect(isValidTransactionAmount('0')).toBe(false);
    expect(isValidTransactionAmount('10.12345')).toBe(false);
    expect(isValidTransactionAmount('-1')).toBe(false);
    expect(isValidTransactionAmount('abc')).toBe(false);
  });

  it('returns ISO period start dates for history filters', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-02T12:00:00.000Z'));

    expect(getPeriodStart('ALL')).toBeUndefined();
    expect(getPeriodStart('7D')).toBe('2026-06-25T12:00:00.000Z');
    expect(getPeriodStart('30D')).toBe('2026-06-02T12:00:00.000Z');
  });
});
