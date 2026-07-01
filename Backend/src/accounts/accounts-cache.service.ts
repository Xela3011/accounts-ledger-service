import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../infrastructure/redis/redis-cache.service';
import { AccountEntity, AccountStatus } from './entities/account.entity';

interface CachedAccount {
  id: string;
  ownerId: string;
  accountNumber: string;
  currency: string;
  balance: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AccountsCacheService {
  private static readonly ttlSeconds = 300;

  constructor(private readonly cache: RedisCacheService) {}

  getAccount(ownerId: string, accountId: string): Promise<AccountEntity | null> {
    return this.cache
      .get<CachedAccount>(this.accountKey(ownerId, accountId))
      .then((account) => (account ? this.toAccountEntity(account) : null));
  }

  setAccount(ownerId: string, account: AccountEntity): Promise<void> {
    return this.cache.set(
      this.accountKey(ownerId, account.id),
      this.toCachedAccount(account),
      AccountsCacheService.ttlSeconds,
    );
  }

  getBalance(ownerId: string, accountId: string): Promise<string | null> {
    return this.cache.get<string>(this.balanceKey(ownerId, accountId));
  }

  setBalance(ownerId: string, accountId: string, balance: string): Promise<void> {
    return this.cache.set(
      this.balanceKey(ownerId, accountId),
      balance,
      AccountsCacheService.ttlSeconds,
    );
  }

  invalidateAccount(ownerId: string, accountId: string): Promise<void> {
    return this.cache.del(this.accountKey(ownerId, accountId), this.balanceKey(ownerId, accountId));
  }

  private accountKey(ownerId: string, accountId: string): string {
    return `account:${ownerId}:${accountId}`;
  }

  private balanceKey(ownerId: string, accountId: string): string {
    return `balance:${ownerId}:${accountId}`;
  }

  private toCachedAccount(account: AccountEntity): CachedAccount {
    return {
      id: account.id,
      ownerId: account.ownerId,
      accountNumber: account.accountNumber,
      currency: account.currency,
      balance: account.balance,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  private toAccountEntity(account: CachedAccount): AccountEntity {
    return {
      id: account.id,
      ownerId: account.ownerId,
      accountNumber: account.accountNumber,
      currency: account.currency,
      balance: account.balance,
      status: account.status,
      createdAt: new Date(account.createdAt),
      updatedAt: new Date(account.updatedAt),
      owner: undefined as never,
      transactions: [],
    };
  }
}
