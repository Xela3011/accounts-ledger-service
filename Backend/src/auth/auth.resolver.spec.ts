import { GUARDS_METADATA } from '@nestjs/common/constants';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UserEntity } from '../users/entities/user.entity';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: jest.Mocked<Pick<AuthService, 'login' | 'getAuthenticatedUser'>>;

  const user: UserEntity = {
    id: '2cbab637-3df6-4e5d-9404-d08ea22d1611',
    email: 'user@example.com',
    name: 'Alexander',
    lastName: 'Batista',
    passwordHash: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    accounts: [],
  };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      getAuthenticatedUser: jest.fn(),
    };

    resolver = new AuthResolver(authService as unknown as AuthService);
  });

  it('delegates login to the auth service', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'signed-jwt',
      user,
    });

    await expect(
      resolver.login({
        email: user.email,
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt',
      user,
    });
  });

  it('protects the authenticated user query with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AuthResolver.prototype.me);

    expect(guards).toContain(JwtAuthGuard);
  });
});
