import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountStatus } from '../entities/account.entity';

export interface CreateAccountData {
  ownerId: string;
  accountNumber: string;
  currency: string;
  balance: string;
  status: AccountStatus;
}

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repository: Repository<AccountEntity>,
  ) {}

  async create(data: CreateAccountData): Promise<AccountEntity> {
    const account = this.repository.create(data);
    return this.repository.save(account);
  }

  findByOwner(ownerId: string): Promise<AccountEntity[]> {
    return this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdForOwner(id: string, ownerId: string): Promise<AccountEntity | null> {
    return this.repository.findOne({
      where: { id, ownerId },
    });
  }

  updateStatusForOwner(
    id: string,
    ownerId: string,
    status: AccountStatus,
  ): Promise<AccountEntity | null> {
    return this.repository.manager.transaction(async (manager) => {
      const account = await manager.findOne(AccountEntity, {
        where: { id, ownerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        return null;
      }

      if (account.status === AccountStatus.Closed && status !== AccountStatus.Closed) {
        return account;
      }

      account.status = status;

      return manager.save(AccountEntity, account);
    });
  }

  existsByAccountNumber(accountNumber: string): Promise<boolean> {
    return this.repository.exists({
      where: { accountNumber },
    });
  }
}
