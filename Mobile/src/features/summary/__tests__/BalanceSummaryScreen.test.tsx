import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react-native';

import {
  BALANCE_SUMMARY_QUERY,
  BalanceSummaryScreen,
} from '../BalanceSummaryScreen';

const accountId = '7d3c65e9-77d0-45ce-9f7f-ffdc61c4973d';

describe('<BalanceSummaryScreen />', () => {
  it('renders current balance, credit totals, and debit totals', async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: BALANCE_SUMMARY_QUERY,
              variables: { accountId },
            },
            result: {
              data: {
                account: {
                  __typename: 'Account',
                  accountNumber: 'ACC-001',
                  balance: '875.0000',
                  createdAt: '2026-07-01T12:00:00.000Z',
                  currency: 'DOP',
                  id: accountId,
                  status: 'Active',
                  updatedAt: '2026-07-02T12:00:00.000Z',
                },
                balanceSummary: {
                  __typename: 'BalanceSummary',
                  accountId,
                  currentBalance: '875.0000',
                  totalCredits: '1000.0000',
                  totalDebits: '125.0000',
                },
              },
            },
          },
        ]}
        showWarnings={false}
      >
        <BalanceSummaryScreen
          navigation={{} as never}
          route={{
            key: 'BalanceSummary',
            name: 'BalanceSummary',
            params: {
              accountId,
              accountNumber: 'ACC-001',
            },
          }}
        />
      </MockedProvider>,
    );

    expect(await screen.findByText('ACC-001')).toBeTruthy();
    expect(screen.getAllByText('DOP 875.00')).toHaveLength(2);
    expect(screen.getByText('DOP 1,000.00')).toBeTruthy();
    expect(screen.getByText('DOP 125.00')).toBeTruthy();
    expect(screen.getByText('Actividad neta')).toBeTruthy();
  });
});
