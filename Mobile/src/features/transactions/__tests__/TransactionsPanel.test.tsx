import { MockedProvider } from '@apollo/client/testing/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ReactNode } from 'react';
import { MockedResponse } from '@apollo/client/testing';

import {
  CREDIT_ACCOUNT_MUTATION,
  DEBIT_ACCOUNT_MUTATION,
  TRANSACTIONS_QUERY,
  TransactionsPanel,
} from '../TransactionsPanel';
import { Transaction } from '../types';

const accountId = '7d3c65e9-77d0-45ce-9f7f-ffdc61c4973d';
const defaultInput = {
  accountId,
  limit: 10,
  offset: 0,
};

function renderWithApollo(
  children: ReactNode,
  mocks: readonly MockedResponse[],
) {
  return render(
    <MockedProvider mocks={mocks} showWarnings={false}>
      {children}
    </MockedProvider>,
  );
}

function renderPanel(mocks: readonly MockedResponse[], onPosted = jest.fn()) {
  renderWithApollo(
    <TransactionsPanel
      accountCurrency="DOP"
      accountId={accountId}
      onTransactionPosted={onPosted}
    />,
    mocks,
  );

  return { onPosted };
}

function transaction(
  id: string,
  overrides: Partial<Transaction> = {},
): Transaction & { __typename: 'Transaction' } {
  return {
    __typename: 'Transaction',
    accountId,
    amount: '125.5000',
    createdAt: '2026-07-02T12:00:00.000Z',
    description: 'Payroll',
    id,
    type: 'Credit',
    ...overrides,
  };
}

function transactionsQueryMock(
  input: Record<string, unknown>,
  transactions: (Transaction & { __typename: 'Transaction' })[],
): MockedResponse {
  return {
    request: {
      query: TRANSACTIONS_QUERY,
      variables: { input },
    },
    result: {
      data: {
        transactions,
      },
    },
  };
}

describe('<TransactionsPanel />', () => {
  it('renders transaction history returned by GraphQL', async () => {
    renderPanel([
      transactionsQueryMock(defaultInput, [
        transaction('txn-1'),
        transaction('txn-2', {
          amount: '25.0000',
          description: 'Card purchase',
          type: 'Debit',
        }),
      ]),
    ]);

    expect(await screen.findByText('Payroll')).toBeTruthy();
    expect(screen.getByText('Card purchase')).toBeTruthy();
    expect(screen.getByText('+DOP 125.50')).toBeTruthy();
    expect(screen.getByText('-DOP 25.00')).toBeTruthy();
  });

  it('refetches history when the type filter changes', async () => {
    renderPanel([
      transactionsQueryMock(defaultInput, []),
      transactionsQueryMock(
        {
          ...defaultInput,
          type: 'Credit',
        },
        [transaction('txn-credit', { description: 'Filtered credit' })],
      ),
    ]);

    expect(await screen.findByText('Sin movimientos')).toBeTruthy();

    fireEvent.press(screen.getByText('Creditos'));

    expect(await screen.findByText('Filtered credit')).toBeTruthy();
  });

  it('posts a credit and refreshes history', async () => {
    const { onPosted } = renderPanel(
      [
        transactionsQueryMock(defaultInput, []),
        {
          request: {
            query: CREDIT_ACCOUNT_MUTATION,
            variables: {
              input: {
                accountId,
                amount: '75.5',
                description: 'Opening deposit',
              },
            },
          },
          result: {
            data: {
              creditAccount: transaction('txn-credit', {
                amount: '75.5000',
                description: 'Opening deposit',
              }),
            },
          },
        },
        transactionsQueryMock(defaultInput, [
          transaction('txn-credit', {
            amount: '75.5000',
            description: 'Opening deposit',
          }),
        ]),
      ],
      jest.fn(),
    );

    await screen.findByText('Sin movimientos');

    fireEvent.changeText(screen.getByPlaceholderText('Monto'), '75,5');
    fireEvent.changeText(
      screen.getByPlaceholderText('Descripcion opcional'),
      'Opening deposit',
    );
    fireEvent.press(screen.getByText('Registrar crédito'));

    expect(await screen.findByText('Opening deposit')).toBeTruthy();
    await waitFor(() => expect(onPosted).toHaveBeenCalledTimes(1));
  });

  it('shows insufficient funds feedback for rejected debits', async () => {
    renderPanel([
      transactionsQueryMock(defaultInput, []),
      {
        request: {
          query: DEBIT_ACCOUNT_MUTATION,
          variables: {
            input: {
              accountId,
              amount: '200',
              description: null,
            },
          },
        },
        error: new Error('Insufficient funds'),
      },
    ]);

    await screen.findByText('Sin movimientos');

    fireEvent.press(screen.getByText('Debito'));
    fireEvent.changeText(screen.getByPlaceholderText('Monto'), '200');
    fireEvent.press(screen.getByText('Registrar débito'));

    expect(
      await screen.findByText('Fondos insuficientes para completar el debito.'),
    ).toBeTruthy();
  });

  it('loads the next page of transactions', async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      transaction(`txn-${index + 1}`, {
        amount: `${index + 1}.0000`,
        description: `Movement ${index + 1}`,
      }),
    );

    renderPanel([
      transactionsQueryMock(defaultInput, firstPage),
      transactionsQueryMock(
        {
          ...defaultInput,
          offset: 10,
        },
        [
          transaction('txn-11', {
            amount: '11.0000',
            description: 'Movement 11',
          }),
        ],
      ),
    ]);

    expect(await screen.findByText('Movement 10')).toBeTruthy();

    fireEvent.press(screen.getByText('Cargar más'));

    expect(await screen.findByText('Movement 11')).toBeTruthy();
  });
});
