export type TransactionType = 'CREDIT' | 'Credit' | 'DEBIT' | 'Debit';

export type Transaction = {
  accountId: string;
  amount: string;
  createdAt: string;
  description: string | null;
  id: string;
  type: TransactionType;
};

export type TransactionFilter = 'ALL' | 'Credit' | 'Debit';
export type TransactionMode = 'Credit' | 'Debit';
export type TransactionPeriod = 'ALL' | '7D' | '30D';

export type TransactionHistoryInput = {
  accountId: string;
  from?: string;
  limit: number;
  offset: number;
  type?: Exclude<TransactionFilter, 'ALL'>;
};
