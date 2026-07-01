import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AccountEntity, AccountStatus } from '../../accounts/entities/account.entity';
import { TransactionEntity, TransactionType } from '../entities/transaction.entity';
import {
  AccountNotFoundForTransactionError,
  InsufficientFundsError,
  TransactionsRepository,
} from './transactions.repository';

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let transactionRepository: { createQueryBuilder: jest.Mock<() => unknown> };
  let dataSource: {
    transaction: jest.Mock<
      (callback: (entityManager: EntityManager) => Promise<unknown>) => Promise<unknown>
    >;
  };
  let manager: {
    findOne: jest.Mock<() => Promise<AccountEntity | null>>;
    save: jest.Mock<(_target: unknown, entity: unknown) => Promise<unknown>>;
    create: jest.Mock<(_target: unknown, entity: unknown) => TransactionEntity>;
  };

  const ownerId = '2cbab637-3df6-4e5d-9404-d08ea22d1611';
  const accountId = '1f6cf2c4-f5d0-44eb-90a4-f77e03545267';
  const account: AccountEntity = {
    id: accountId,
    ownerId,
    accountNumber: 'QIK-ACCOUNT-0001',
    currency: 'DOP',
    balance: '100.0000',
    status: AccountStatus.Active,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    owner: undefined as never,
    transactions: [],
  };
  const transaction: TransactionEntity = {
    id: '5b916fc9-01ff-4f45-875e-801fb9473b23',
    accountId,
    amount: '25.0000',
    type: TransactionType.Credit,
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    account: undefined as never,
  };

  beforeEach(() => {
    manager = {
      findOne: jest.fn<() => Promise<AccountEntity | null>>(),
      save: jest.fn<(_target: unknown, entity: unknown) => Promise<unknown>>(),
      create: jest.fn<(_target: unknown, entity: unknown) => TransactionEntity>(),
    };
    dataSource = {
      transaction: jest.fn<
        (callback: (entityManager: EntityManager) => Promise<unknown>) => Promise<unknown>
      >(async (callback) => callback(manager as unknown as EntityManager)),
    };
    transactionRepository = {
      createQueryBuilder: jest.fn<() => unknown>(),
    };

    repository = new TransactionsRepository(
      transactionRepository as unknown as Repository<TransactionEntity>,
      dataSource as unknown as DataSource,
    );
  });

  it('credits an account and transaction in a database transaction', async () => {
    manager.findOne.mockResolvedValue({ ...account });
    manager.save.mockImplementation(async (_target: unknown, entity: unknown) => entity);
    manager.create.mockReturnValue(transaction as never);

    await expect(
      repository.createLedgerTransaction({
        ownerId,
        accountId,
        amount: '25.0000',
        type: TransactionType.Credit,
        description: null,
      }),
    ).resolves.toEqual(transaction);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.findOne).toHaveBeenCalledWith(AccountEntity, {
      where: { id: accountId, ownerId },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(
      AccountEntity,
      expect.objectContaining({ balance: '125.0000' }),
    );
  });

  it('debits an account when funds are available', async () => {
    manager.findOne.mockResolvedValue({ ...account });
    manager.save.mockImplementation(async (_target: unknown, entity: unknown) => entity);
    manager.create.mockReturnValue({ ...transaction, type: TransactionType.Debit } as never);

    await repository.createLedgerTransaction({
      ownerId,
      accountId,
      amount: '25.0000',
      type: TransactionType.Debit,
      description: null,
    });

    expect(manager.save).toHaveBeenCalledWith(
      AccountEntity,
      expect.objectContaining({ balance: '75.0000' }),
    );
  });

  it('rejects debits that would overdraw an account', async () => {
    manager.findOne.mockResolvedValue({ ...account });

    await expect(
      repository.createLedgerTransaction({
        ownerId,
        accountId,
        amount: '125.0000',
        type: TransactionType.Debit,
        description: null,
      }),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects accounts outside the current owner', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      repository.createLedgerTransaction({
        ownerId,
        accountId,
        amount: '25.0000',
        type: TransactionType.Credit,
        description: null,
      }),
    ).rejects.toBeInstanceOf(AccountNotFoundForTransactionError);
  });

  it('applies transaction history filters and sorts newest first', async () => {
    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn<() => Promise<TransactionEntity[]>>().mockResolvedValue([transaction]),
    };
    transactionRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      repository.findHistory({
        ownerId,
        accountId,
        type: TransactionType.Credit,
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T23:59:59.999Z'),
        limit: 10,
        offset: 5,
      }),
    ).resolves.toEqual([transaction]);
    expect(queryBuilder.where).toHaveBeenCalledWith('account.ownerId = :ownerId', { ownerId });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('transaction.createdAt', 'DESC');
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.accountId = :accountId', {
      accountId,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('transaction.type = :type', {
      type: TransactionType.Credit,
    });
  });

  it('calculates credit and debit totals for an account', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest
        .fn<() => Promise<{ totalCredits: string; totalDebits: string }>>()
        .mockResolvedValue({
          totalCredits: '150.5',
          totalDebits: '25',
        }),
    };
    transactionRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(repository.sumByTypeForAccount(accountId)).resolves.toEqual({
      totalCredits: '150.5000',
      totalDebits: '25.0000',
    });
    expect(queryBuilder.where).toHaveBeenCalledWith('transaction.accountId = :accountId', {
      accountId,
    });
    expect(queryBuilder.setParameters).toHaveBeenCalledWith({
      credit: TransactionType.Credit,
      debit: TransactionType.Debit,
    });
  });
});
