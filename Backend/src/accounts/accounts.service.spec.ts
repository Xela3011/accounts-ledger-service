import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccountsCacheService } from './accounts-cache.service';
import { AccountsService } from './accounts.service';
import { AccountEntity, AccountStatus } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountsRepository: jest.Mocked<
    Pick<
      AccountsRepository,
      | 'create'
      | 'findByOwner'
      | 'findByIdForOwner'
      | 'updateStatusForOwner'
      | 'existsByAccountNumber'
    >
  >;
  let accountsCache: jest.Mocked<
    Pick<
      AccountsCacheService,
      'getAccount' | 'setAccount' | 'getBalance' | 'setBalance' | 'invalidateAccount'
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
      updateStatusForOwner: jest.fn(),
      existsByAccountNumber: jest.fn(),
    };
    accountsCache = {
      getAccount: jest.fn(),
      setAccount: jest.fn(),
      getBalance: jest.fn(),
      setBalance: jest.fn(),
      invalidateAccount: jest.fn(),
    };
    accountsCache.getAccount.mockResolvedValue(null);
    accountsCache.getBalance.mockResolvedValue(null);
    accountsCache.setAccount.mockResolvedValue(undefined);
    accountsCache.setBalance.mockResolvedValue(undefined);
    accountsCache.invalidateAccount.mockResolvedValue(undefined);

    service = new AccountsService(
      accountsRepository as unknown as AccountsRepository,
      accountsCache as unknown as AccountsCacheService,
    );
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
    expect(accountsCache.setAccount).toHaveBeenCalledWith(ownerId, account);
    expect(accountsCache.setBalance).toHaveBeenCalledWith(ownerId, account.id, account.balance);
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
    expect(accountsCache.setAccount).toHaveBeenCalledWith(ownerId, account);
    expect(accountsCache.setBalance).toHaveBeenCalledWith(ownerId, account.id, account.balance);
  });

  it('returns a cached account without querying the repository', async () => {
    accountsCache.getAccount.mockResolvedValue(account);

    await expect(service.getAccount(ownerId, accountId)).resolves.toEqual(account);
    expect(accountsRepository.findByIdForOwner).not.toHaveBeenCalled();
  });

  it('returns the current balance for an owned account', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(account);

    await expect(service.getBalance(ownerId, accountId)).resolves.toBe(account.balance);
    expect(accountsCache.setBalance).toHaveBeenCalledWith(ownerId, accountId, account.balance);
  });

  it('returns a cached balance without querying the repository', async () => {
    accountsCache.getBalance.mockResolvedValue('1000.0000');

    await expect(service.getBalance(ownerId, accountId)).resolves.toBe('1000.0000');
    expect(accountsRepository.findByIdForOwner).not.toHaveBeenCalled();
  });

  it('freezes an owned account and refreshes the cache', async () => {
    const frozenAccount = { ...account, status: AccountStatus.Frozen };
    accountsRepository.findByIdForOwner.mockResolvedValue(account);
    accountsRepository.updateStatusForOwner.mockResolvedValue(frozenAccount);

    await expect(service.freeze(ownerId, accountId)).resolves.toEqual(frozenAccount);
    expect(accountsRepository.updateStatusForOwner).toHaveBeenCalledWith(
      accountId,
      ownerId,
      AccountStatus.Frozen,
    );
    expect(accountsCache.setAccount).toHaveBeenCalledWith(ownerId, frozenAccount);
    expect(accountsCache.setBalance).toHaveBeenCalledWith(
      ownerId,
      frozenAccount.id,
      frozenAccount.balance,
    );
  });

  it('unfreezes an owned account', async () => {
    const frozenAccount = { ...account, status: AccountStatus.Frozen };
    accountsRepository.findByIdForOwner.mockResolvedValue(frozenAccount);
    accountsRepository.updateStatusForOwner.mockResolvedValue(account);

    await expect(service.unfreeze(ownerId, accountId)).resolves.toEqual(account);
    expect(accountsRepository.updateStatusForOwner).toHaveBeenCalledWith(
      accountId,
      ownerId,
      AccountStatus.Active,
    );
  });

  it('cancels an owned account', async () => {
    const closedAccount = { ...account, status: AccountStatus.Closed };
    accountsRepository.findByIdForOwner.mockResolvedValue(account);
    accountsRepository.updateStatusForOwner.mockResolvedValue(closedAccount);

    await expect(service.cancel(ownerId, accountId)).resolves.toEqual(closedAccount);
    expect(accountsRepository.updateStatusForOwner).toHaveBeenCalledWith(
      accountId,
      ownerId,
      AccountStatus.Closed,
    );
  });

  it('does not reactivate closed accounts', async () => {
    const closedAccount = { ...account, status: AccountStatus.Closed };
    accountsRepository.findByIdForOwner.mockResolvedValue(closedAccount);

    await expect(service.unfreeze(ownerId, accountId)).rejects.toBeInstanceOf(BadRequestException);
    expect(accountsRepository.updateStatusForOwner).not.toHaveBeenCalled();
  });

  it('rejects status updates when the account is not found for the owner', async () => {
    accountsRepository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.freeze(ownerId, accountId)).rejects.toBeInstanceOf(NotFoundException);
    expect(accountsRepository.updateStatusForOwner).not.toHaveBeenCalled();
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
