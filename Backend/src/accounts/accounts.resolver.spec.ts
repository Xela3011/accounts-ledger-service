import { GUARDS_METADATA } from '@nestjs/common/constants';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountEntity, AccountStatus } from './entities/account.entity';

describe('AccountsResolver', () => {
  let resolver: AccountsResolver;
  let accountsService: jest.Mocked<
    Pick<AccountsService, 'create' | 'list' | 'getAccount' | 'getBalance'>
  >;

  const user: AuthenticatedUser = {
    id: '2cbab637-3df6-4e5d-9404-d08ea22d1611',
    email: 'user@example.com',
  };
  const accountId = '1f6cf2c4-f5d0-44eb-90a4-f77e03545267';
  const account: AccountEntity = {
    id: accountId,
    ownerId: user.id,
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
    accountsService = {
      create: jest.fn(),
      list: jest.fn(),
      getAccount: jest.fn(),
      getBalance: jest.fn(),
    };

    resolver = new AccountsResolver(accountsService as unknown as AccountsService);
  });

  it('protects account operations with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AccountsResolver);

    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates account creation to the service with the current user id', async () => {
    accountsService.create.mockResolvedValue(account);

    await expect(resolver.createAccount(user, { currency: 'DOP' })).resolves.toEqual(account);
    expect(accountsService.create).toHaveBeenCalledWith(user.id, { currency: 'DOP' });
  });

  it('lists accounts for the current user', async () => {
    accountsService.list.mockResolvedValue([account]);

    await expect(resolver.accounts(user)).resolves.toEqual([account]);
    expect(accountsService.list).toHaveBeenCalledWith(user.id);
  });

  it('gets an account for the current user', async () => {
    accountsService.getAccount.mockResolvedValue(account);

    await expect(resolver.account(user, accountId)).resolves.toEqual(account);
    expect(accountsService.getAccount).toHaveBeenCalledWith(user.id, accountId);
  });

  it('gets the account balance for the current user', async () => {
    accountsService.getBalance.mockResolvedValue('1000.0000');

    await expect(resolver.balance(user, accountId)).resolves.toBe('1000.0000');
    expect(accountsService.getBalance).toHaveBeenCalledWith(user.id, accountId);
  });
});
