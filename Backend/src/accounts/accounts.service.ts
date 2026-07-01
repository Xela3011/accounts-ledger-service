import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateAccountInput } from './dto/create-account.input';
import { AccountEntity, AccountStatus } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';

@Injectable()
export class AccountsService {
  private static readonly accountNumberAttempts = 5;

  constructor(private readonly accountsRepository: AccountsRepository) {}

  async create(ownerId: string, input: CreateAccountInput): Promise<AccountEntity> {
    const currency = this.normalizeCurrency(input.currency);
    const accountNumber = await this.generateAccountNumber();

    return this.accountsRepository.create({
      ownerId,
      accountNumber,
      currency,
      balance: '0.0000',
      status: AccountStatus.Active,
    });
  }

  list(ownerId: string): Promise<AccountEntity[]> {
    return this.accountsRepository.findByOwner(ownerId);
  }

  async getAccount(ownerId: string, id: string): Promise<AccountEntity> {
    const account = await this.accountsRepository.findByIdForOwner(id, ownerId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async getBalance(ownerId: string, accountId: string): Promise<string> {
    const account = await this.getAccount(ownerId, accountId);
    return account.balance;
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
