import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AccountsCacheService } from './accounts-cache.service';
import { CreateAccountInput } from './dto/create-account.input';
import { AccountEntity, AccountStatus } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';

@Injectable()
export class AccountsService {
  private static readonly accountNumberAttempts = 5;

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly accountsCache: AccountsCacheService,
  ) {}

  async create(ownerId: string, input: CreateAccountInput): Promise<AccountEntity> {
    const currency = this.normalizeCurrency(input.currency);
    const accountNumber = await this.generateAccountNumber();

    const account = await this.accountsRepository.create({
      ownerId,
      accountNumber,
      currency,
      balance: '0.0000',
      status: AccountStatus.Active,
    });

    await this.accountsCache.setAccount(ownerId, account);
    await this.accountsCache.setBalance(ownerId, account.id, account.balance);

    return account;
  }

  list(ownerId: string): Promise<AccountEntity[]> {
    return this.accountsRepository.findByOwner(ownerId);
  }

  async getAccount(ownerId: string, id: string): Promise<AccountEntity> {
    const cachedAccount = await this.accountsCache.getAccount(ownerId, id);

    if (cachedAccount) {
      return cachedAccount;
    }

    const account = await this.accountsRepository.findByIdForOwner(id, ownerId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await this.accountsCache.setAccount(ownerId, account);
    await this.accountsCache.setBalance(ownerId, account.id, account.balance);

    return account;
  }

  async getBalance(ownerId: string, accountId: string): Promise<string> {
    const cachedBalance = await this.accountsCache.getBalance(ownerId, accountId);

    if (cachedBalance) {
      return cachedBalance;
    }

    const account = await this.getAccount(ownerId, accountId);
    await this.accountsCache.setBalance(ownerId, accountId, account.balance);

    return account.balance;
  }

  freeze(ownerId: string, accountId: string): Promise<AccountEntity> {
    return this.updateStatus(ownerId, accountId, AccountStatus.Frozen);
  }

  unfreeze(ownerId: string, accountId: string): Promise<AccountEntity> {
    return this.updateStatus(ownerId, accountId, AccountStatus.Active);
  }

  cancel(ownerId: string, accountId: string): Promise<AccountEntity> {
    return this.updateStatus(ownerId, accountId, AccountStatus.Closed);
  }

  private async updateStatus(
    ownerId: string,
    accountId: string,
    status: AccountStatus,
  ): Promise<AccountEntity> {
    const account = await this.getAccount(ownerId, accountId);

    if (account.status === AccountStatus.Closed && status !== AccountStatus.Closed) {
      throw new BadRequestException('Closed accounts cannot be reactivated');
    }

    const updatedAccount = await this.accountsRepository.updateStatusForOwner(
      accountId,
      ownerId,
      status,
    );

    if (!updatedAccount) {
      throw new NotFoundException('Account not found');
    }

    await this.accountsCache.setAccount(ownerId, updatedAccount);
    await this.accountsCache.setBalance(ownerId, updatedAccount.id, updatedAccount.balance);

    if (updatedAccount.status !== status) {
      throw new BadRequestException('Closed accounts cannot be reactivated');
    }

    return updatedAccount;
  }

  private normalizeCurrency(currency: string): string {
    const normalizedCurrency = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new BadRequestException('Currency must be a 3-letter ISO code');
    }

    return normalizedCurrency;
  }

  private async generateAccountNumber(): Promise<string> {
    for (let attempt = 0; attempt < AccountsService.accountNumberAttempts; attempt += 1) {
      const accountNumber = `QIK-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
      const exists = await this.accountsRepository.existsByAccountNumber(accountNumber);

      if (!exists) {
        return accountNumber;
      }
    }

    throw new ConflictException('Could not generate a unique account number');
  }
}
