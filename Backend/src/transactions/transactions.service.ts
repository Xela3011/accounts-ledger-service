import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsCacheService } from '../accounts/accounts-cache.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountsRepository } from '../accounts/repositories/accounts.repository';
import { BalanceSummary } from './dto/balance-summary.model';
import { formatFixedDecimal, isFixedDecimal, parseFixedDecimal } from './decimal';
import { TransactionInput } from './dto/transaction.input';
import { TransactionHistoryInput } from './dto/transaction-history.input';
import { TransactionEntity, TransactionType } from './entities/transaction.entity';
import {
  AccountNotFoundForTransactionError,
  AccountUnavailableForTransactionError,
  InsufficientFundsError,
  TransactionsRepository,
} from './repositories/transactions.repository';

@Injectable()
export class TransactionsService {
  private static readonly defaultLimit = 25;
  private static readonly defaultOffset = 0;

  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly accountsService: AccountsService,
    private readonly accountsCache: AccountsCacheService,
  ) {}

  credit(ownerId: string, input: TransactionInput): Promise<TransactionEntity> {
    return this.post(ownerId, input, TransactionType.Credit);
  }

  debit(ownerId: string, input: TransactionInput): Promise<TransactionEntity> {
    return this.post(ownerId, input, TransactionType.Debit);
  }

  async history(
    ownerId: string,
    input: TransactionHistoryInput = {},
  ): Promise<TransactionEntity[]> {
    if (input.from && input.to && input.from > input.to) {
      throw new BadRequestException('From date must be before to date');
    }

    if (input.accountId) {
      const account = await this.accountsRepository.findByIdForOwner(input.accountId, ownerId);

      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    return this.transactionsRepository.findHistory({
      ownerId,
      accountId: input.accountId,
      type: input.type,
      from: input.from,
      to: input.to,
      limit: input.limit ?? TransactionsService.defaultLimit,
      offset: input.offset ?? TransactionsService.defaultOffset,
    });
  }

  async balanceSummary(ownerId: string, accountId: string): Promise<BalanceSummary> {
    const account = await this.accountsService.getAccount(ownerId, accountId);
    const totals = await this.transactionsRepository.sumByTypeForAccount(accountId);

    return {
      accountId,
      currentBalance: account.balance,
      totalCredits: totals.totalCredits,
      totalDebits: totals.totalDebits,
    };
  }

  private async post(
    ownerId: string,
    input: TransactionInput,
    type: TransactionType,
  ): Promise<TransactionEntity> {
    const amount = this.normalizeAmount(input.amount);

    try {
      const transaction = await this.transactionsRepository.createLedgerTransaction({
        ownerId,
        accountId: input.accountId,
        amount,
        type,
        description: input.description ?? null,
      });

      await this.accountsCache.invalidateAccount(ownerId, input.accountId);

      return transaction;
    } catch (error) {
      if (error instanceof AccountNotFoundForTransactionError) {
        throw new NotFoundException('Account not found');
      }

      if (error instanceof InsufficientFundsError) {
        throw new BadRequestException('Insufficient funds');
      }

      if (error instanceof AccountUnavailableForTransactionError) {
        throw new BadRequestException('Account is not active');
      }

      throw error;
    }
  }

  private normalizeAmount(amount: string): string {
    const trimmedAmount = amount.trim();

    if (!isFixedDecimal(trimmedAmount)) {
      throw new BadRequestException('Amount must be a positive decimal with up to 4 places');
    }

    const amountInUnits = parseFixedDecimal(trimmedAmount);

    if (amountInUnits <= 0n) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return formatFixedDecimal(amountInUnits);
  }
}
