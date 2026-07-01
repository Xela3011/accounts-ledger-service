import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccountEntity, AccountStatus } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountsRepository: jest.Mocked<
    Pick<
      AccountsRepository,
      'create' | 'findByOwner' | 'findByIdForOwner' | 'existsByAccountNumber'
    >
  >;

  const ownerId = '2cbab637-3df6-4e5d-9404-d08ea22d1611';
  const accountId = '1f6cf2c4-f5d0-44eb-90a4-f77e03545267';
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
    accountsRepository = {
      create: jest.fn(),
      findByOwner: jest.fn(),
      findByIdForOwner: jest.fn(),
      existsByAccountNumber: jest.fn(),
    };

    service = new AccountsService(accountsRepository as unknown as AccountsRepository);
  });

  it('creates an account for the owner with an uppercase currency and zero balance', async () => {
    accountsRepository.existsByAccountNumber.mockResolvedValue(false);
    accountsRepository.create.mockResolvedValue(account);

    await expect(service.create(ownerId, { currency: 'dop' })).resolves.toEqual(account);
    expect(accountsRepository.create).toHaveBeenCalledWith({
      ownerId,
      accountNumber: expect.stringMatching(/^QIK-[A-F0-9]{16}$/) as unknown as string,
      currency: 'DOP',
      balance: '0.0000',
      status: AccountStatus.Active,
    });
  });

  it('lists accounts owned by the user', async () => {
    accountsRepository.findByOwner.mockResolvedValue([account]);

    await expect(service.list(ownerId)).resolves.toEqual([account]);
    expect(accountsRepository.findByOwner).toHaveBeenCalledWith(ownerId);
  });

  it('gets an account owned by the user', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(account);

    await expect(service.getAccount(ownerId, accountId)).resolves.toEqual(account);
    expect(accountsRepository.findByIdForOwner).toHaveBeenCalledWith(accountId, ownerId);
  });

  it('returns the current balance for an owned account', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(account);

    await expect(service.getBalance(ownerId, accountId)).resolves.toBe(account.balance);
  });

  it('rejects access when an account is not found for the owner', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.getAccount(ownerId, accountId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid currencies', async () => {
    await expect(service.create(ownerId, { currency: 'DO' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(accountsRepository.create).not.toHaveBeenCalled();
  });

  it('fails when a unique account number cannot be generated', async () => {
    accountsRepository.existsByAccountNumber.mockResolvedValue(true);

    await expect(service.create(ownerId, { currency: 'DOP' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(accountsRepository.create).not.toHaveBeenCalled();
  });
});
