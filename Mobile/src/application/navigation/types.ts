export type RootStackParamList = {
  AccountDetails: {
    accountId: string;
    accountNumber?: string;
  };
  BalanceSummary: {
    accountId: string;
    accountNumber?: string;
  };
  Home: undefined;
  Login: undefined;
};
