import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { formatFixedDecimal, parseFixedDecimal } from '../decimal';
import { TransactionEntity, TransactionType } from '../entities/transaction.entity';

export class AccountNotFoundForTransactionError extends Error {
  constructor() {
    super('Account not found');
  }
}

export class InsufficientFundsError extends Error {
  constructor() {
    super('Insufficient funds');
  }
}

export interface CreateLedgerTransactionData {
  ownerId: string;
  accountId: string;
  amount: string;
  type: TransactionType;
  description?: string | null;
}

export interface TransactionHistoryFilters {
  ownerId: string;
  accountId?: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export interface TransactionTotals {
  totalCredits: string;
  totalDebits: string;
}

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  createLedgerTransaction(data: CreateLedgerTransactionData): Promise<TransactionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(AccountEntity, {
        where: { id: data.accountId, ownerId: data.ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new AccountNotFoundForTransactionError();
      }

      const currentBalance = parseFixedDecimal(account.balance);
      const transactionAmount = parseFixedDecimal(data.amount);
      const nextBalance =
        data.type === TransactionType.Credit
          ? currentBalance + transactionAmount
          : currentBalance - transactionAmount;

      if (nextBalance < 0n) {
        throw new InsufficientFundsError();
      }

      account.balance = formatFixedDecimal(nextBalance);
      await manager.save(AccountEntity, account);

      const transaction = manager.create(TransactionEntity, {
        accountId: data.accountId,
        amount: data.amount,
        type: data.type,
        description: data.description ?? null,
      });

      return manager.save(TransactionEntity, transaction);
    });
  }

  findHistory(filters: TransactionHistoryFilters): Promise<TransactionEntity[]> {
    const query = this.repository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.account', 'account')
      .where('account.ownerId = :ownerId', { ownerId: filters.ownerId })
      .orderBy('transaction.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset);

    if (filters.accountId) {
      query.andWhere('transaction.accountId = :accountId', { accountId: filters.accountId });
    }

    if (filters.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.from) {
      query.andWhere('transaction.createdAt >= :from', { from: filters.from });
    }

    if (filters.to) {
      query.andWhere('transaction.createdAt <= :to', { to: filters.to });
    }

    return query.getMany();
  }

  async sumByTypeForAccount(accountId: string): Promise<TransactionTotals> {
    const totals = await this.repository
      .createQueryBuilder('transaction')
      .select(
        'COALESCE(SUM(CASE WHEN transaction.type = :credit THEN transaction.amount ELSE 0 END), 0)',
        'totalCredits',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :debit THEN transaction.amount ELSE 0 END), 0)',
        'totalDebits',
      )
      .where('transaction.accountId = :accountId', { accountId })
      .setParameters({
        credit: TransactionType.Credit,
        debit: TransactionType.Debit,
      })
      .getRawOne<{ totalCredits?: string | null; totalDebits?: string | null }>();

    return {
      totalCredits: formatFixedDecimal(parseFixedDecimal(totals?.totalCredits ?? '0')),
      totalDebits: formatFixedDecimal(parseFixedDecimal(totals?.totalDebits ?? '0')),
    };
  }
}
