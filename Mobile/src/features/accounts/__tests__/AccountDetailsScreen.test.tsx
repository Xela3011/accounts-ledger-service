import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  ACCOUNT_DETAILS_QUERY,
  AccountDetailsScreen,
} from '../AccountDetailsScreen';
import { TRANSACTIONS_QUERY } from '../../transactions/TransactionsPanel';

const accountId = '7d3c65e9-77d0-45ce-9f7f-ffdc61c4973d';
const navigate = jest.fn();

describe('<AccountDetailsScreen />', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('renders account details and delegates transaction UI to the panel', async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: ACCOUNT_DETAILS_QUERY,
              variables: { id: accountId },
            },
            result: {
              data: {
                account: {
                  __typename: 'Account',
                  accountNumber: 'ACC-001',
                  balance: '300.0000',
                  createdAt: '2026-07-01T12:00:00.000Z',
                  currency: 'DOP',
                  id: accountId,
                  status: 'Active',
                  updatedAt: '2026-07-02T12:00:00.000Z',
                },
                balance: '300.0000',
              },
            },
          },
          {
            request: {
              query: TRANSACTIONS_QUERY,
              variables: {
                input: {
                  accountId,
                  limit: 10,
                  offset: 0,
                },
              },
            },
            result: {
              data: {
                transactions: [],
              },
            },
          },
        ]}
        showWarnings={false}
      >
        <AccountDetailsScreen
          navigation={{} as never}
          route={{
            key: 'AccountDetails',
            name: 'AccountDetails',
            params: {
              accountId,
              accountNumber: 'ACC-001',
            },
          }}
        />
      </MockedProvider>,
    );

    expect(await screen.findByText('ACC-001')).toBeTruthy();
    expect(screen.getByText('DOP 300.00')).toBeTruthy();
    expect(await screen.findByText('Nueva transaccion')).toBeTruthy();
  });

  it('navigates to the balance summary screen', async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: ACCOUNT_DETAILS_QUERY,
              variables: { id: accountId },
            },
            result: {
              data: {
                account: {
                  __typename: 'Account',
                  accountNumber: 'ACC-001',
                  balance: '300.0000',
                  createdAt: '2026-07-01T12:00:00.000Z',
                  currency: 'DOP',
                  id: accountId,
                  status: 'Active',
                  updatedAt: '2026-07-02T12:00:00.000Z',
                },
                balance: '300.0000',
              },
            },
          },
          {
            request: {
              query: TRANSACTIONS_QUERY,
              variables: {
                input: {
                  accountId,
                  limit: 10,
                  offset: 0,
                },
              },
            },
            result: {
              data: {
                transactions: [],
              },
            },
          },
        ]}
        showWarnings={false}
      >
        <AccountDetailsScreen
          navigation={{ navigate } as never}
          route={{
            key: 'AccountDetails',
            name: 'AccountDetails',
            params: {
              accountId,
              accountNumber: 'ACC-001',
            },
          }}
        />
      </MockedProvider>,
    );

    fireEvent.press(await screen.findByText('Ver resumen'));

    expect(navigate).toHaveBeenCalledWith('BalanceSummary', {
      accountId,
      accountNumber: 'ACC-001',
    });
  });
});
