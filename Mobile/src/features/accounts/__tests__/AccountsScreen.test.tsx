import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ACCOUNTS_QUERY, AccountsScreen } from '../AccountsScreen';

const navigate = jest.fn();

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    logout: jest.fn(),
    user: {
      email: 'alex@example.com',
      id: 'user-1',
      lastName: null,
      name: 'Alex',
    },
  }),
}));

describe('<AccountsScreen />', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('renders accounts and navigates to account details', async () => {
    const accountId = '7d3c65e9-77d0-45ce-9f7f-ffdc61c4973d';

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: ACCOUNTS_QUERY,
            },
            result: {
              data: {
                accounts: [
                  {
                    __typename: 'Account',
                    accountNumber: 'ACC-001',
                    balance: '300.0000',
                    createdAt: '2026-07-01T12:00:00.000Z',
                    currency: 'DOP',
                    id: accountId,
                    status: 'Active',
                    updatedAt: '2026-07-02T12:00:00.000Z',
                  },
                ],
              },
            },
          },
        ]}
        showWarnings={false}
      >
        <AccountsScreen
          navigation={{ navigate } as never}
          route={{} as never}
        />
      </MockedProvider>,
    );

    expect(await screen.findByText('ACC-001')).toBeTruthy();
    expect(screen.getAllByText('DOP 300.00')).toHaveLength(2);

    fireEvent.press(screen.getByText('ACC-001'));

    expect(navigate).toHaveBeenCalledWith('AccountDetails', {
      accountId,
      accountNumber: 'ACC-001',
    });
  });
});
