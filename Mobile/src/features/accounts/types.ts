export type AccountStatus =
  'ACTIVE' | 'Active' | 'CLOSED' | 'Closed' | 'FROZEN' | 'Frozen';

export type Account = {
  accountNumber: string;
  balance: string;
  createdAt: string;
  currency: string;
  id: string;
  status: AccountStatus;
  updatedAt: string;
};
