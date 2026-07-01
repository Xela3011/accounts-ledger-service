import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccountEntity, AccountStatus } from '../accounts/entities/account.entity';
import { AccountsRepository } from '../accounts/repositories/accounts.repository';
import { TransactionEntity, TransactionType } from './entities/transaction.entity';
import {
  AccountNotFoundForTransactionError,
  InsufficientFundsError,
  TransactionsRepository,
} from './repositories/transactions.repository';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: jest.Mocked<
    Pick<TransactionsRepository, 'createLedgerTransaction' | 'findHistory'>
  >;
  let accountsRepository: jest.Mocked<Pick<AccountsRepository, 'findByIdForOwner'>>;

  const ownerId = '2cbab637-3df6-4e5d-9404-d08ea22d1611';
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
  const account: AccountEntity = {
    id: accountId,
    ownerId,
    accountNumber: 'QIK-ACCOUNT-0001',
    currency: 'DOP',
    balance: '1000.0000',
    status: AccountStatus.Active,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    owner: undefined as never,
    transactions: [],
  };

  beforeEach(() => {
    transactionsRepository = {
      createLedgerTransaction: jest.fn(),
      findHistory: jest.fn(),
    };
    accountsRepository = {
      findByIdForOwner: jest.fn(),
    };

    service = new TransactionsService(
      transactionsRepository as unknown as TransactionsRepository,
      accountsRepository as unknown as AccountsRepository,
    );
  });

  it('credits an owned account with a normalized amount', async () => {
    transactionsRepository.createLedgerTransaction.mockResolvedValue(transaction);

    await expect(service.credit(ownerId, { accountId, amount: '100' })).resolves.toEqual(
      transaction,
    );
    expect(transactionsRepository.createLedgerTransaction).toHaveBeenCalledWith({
      ownerId,
      accountId,
      amount: '100.0000',
      type: TransactionType.Credit,
      description: null,
    });
  });

  it('debits an owned account with a normalized amount and description', async () => {
    transactionsRepository.createLedgerTransaction.mockResolvedValue({
      ...transaction,
      amount: '10.5000',
      type: TransactionType.Debit,
      description: 'ATM withdrawal',
    });

    await expect(
      service.debit(ownerId, {
        accountId,
        amount: '10.5',
        description: 'ATM withdrawal',
      }),
    ).resolves.toMatchObject({ type: TransactionType.Debit });
    expect(transactionsRepository.createLedgerTransaction).toHaveBeenCalledWith({
      ownerId,
      accountId,
      amount: '10.5000',
      type: TransactionType.Debit,
      description: 'ATM withdrawal',
    });
  });

  it('rejects amounts that are not greater than zero', async () => {
    await expect(service.credit(ownerId, { accountId, amount: '0.0000' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionsRepository.createLedgerTransaction).not.toHaveBeenCalled();
  });

  it('rejects insufficient funds', async () => {
    transactionsRepository.createLedgerTransaction.mockRejectedValue(new InsufficientFundsError());

    await expect(service.debit(ownerId, { accountId, amount: '100.0000' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects access to accounts that are not owned by the user', async () => {
    transactionsRepository.createLedgerTransaction.mockRejectedValue(
      new AccountNotFoundForTransactionError(),
    );

    await expect(service.credit(ownerId, { accountId, amount: '100.0000' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns transaction history with owner filters and default pagination', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(account);
    transactionsRepository.findHistory.mockResolvedValue([transaction]);

    await expect(
      service.history(ownerId, {
        accountId,
        type: TransactionType.Credit,
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T23:59:59.999Z'),
      }),
    ).resolves.toEqual([transaction]);
    expect(accountsRepository.findByIdForOwner).toHaveBeenCalledWith(accountId, ownerId);
    expect(transactionsRepository.findHistory).toHaveBeenCalledWith({
      ownerId,
      accountId,
      type: TransactionType.Credit,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T23:59:59.999Z'),
      limit: 25,
      offset: 0,
    });
  });

  it('rejects transaction history when the account filter is not owned', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.history(ownerId, { accountId })).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionsRepository.findHistory).not.toHaveBeenCalled();
  });

  it('rejects transaction history when the date range is invalid', async () => {
    await expect(
      service.history(ownerId, {
        from: new Date('2026-02-01T00:00:00.000Z'),
        to: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
