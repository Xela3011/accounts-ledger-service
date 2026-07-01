import { GUARDS_METADATA } from '@nestjs/common/constants';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { TransactionEntity, TransactionType } from './entities/transaction.entity';
import { TransactionsResolver } from './transactions.resolver';
import { TransactionsService } from './transactions.service';

describe('TransactionsResolver', () => {
  let resolver: TransactionsResolver;
  let transactionsService: jest.Mocked<Pick<TransactionsService, 'credit' | 'debit' | 'history'>>;

  const user: AuthenticatedUser = {
    id: '2cbab637-3df6-4e5d-9404-d08ea22d1611',
    email: 'user@example.com',
  };
  const accountId = '1f6cf2c4-f5d0-44eb-90a4-f77e03545267';
  const transaction: TransactionEntity = {
    id: '5b916fc9-01ff-4f45-875e-801fb9473b23',
    accountId,
    amount: '100.0000',
    type: TransactionType.Credit,
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    account: undefined as never,
  };

  beforeEach(() => {
    transactionsService = {
      credit: jest.fn(),
      debit: jest.fn(),
      history: jest.fn(),
    };

    resolver = new TransactionsResolver(transactionsService as unknown as TransactionsService);
  });

  it('protects transaction operations with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TransactionsResolver);

    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates credits to the service with the current user id', async () => {
    transactionsService.credit.mockResolvedValue(transaction);

    await expect(resolver.creditAccount(user, { accountId, amount: '100.0000' })).resolves.toEqual(
      transaction,
    );
    expect(transactionsService.credit).toHaveBeenCalledWith(user.id, {
      accountId,
      amount: '100.0000',
    });
  });

  it('delegates debits to the service with the current user id', async () => {
    transactionsService.debit.mockResolvedValue({ ...transaction, type: TransactionType.Debit });

    await expect(resolver.debitAccount(user, { accountId, amount: '25.0000' })).resolves.toEqual({
      ...transaction,
      type: TransactionType.Debit,
    });
    expect(transactionsService.debit).toHaveBeenCalledWith(user.id, {
      accountId,
      amount: '25.0000',
    });
  });

  it('delegates history queries to the service with the current user id', async () => {
    transactionsService.history.mockResolvedValue([transaction]);

    await expect(
      resolver.transactions(user, { accountId, type: TransactionType.Credit }),
    ).resolves.toEqual([transaction]);
    expect(transactionsService.history).toHaveBeenCalledWith(user.id, {
      accountId,
      type: TransactionType.Credit,
    });
  });
});
