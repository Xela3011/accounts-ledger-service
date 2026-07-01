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

  existsByAccountNumber(accountNumber: string): Promise<boolean> {
    return this.repository.exists({
      where: { accountNumber },
    });
  }
}
