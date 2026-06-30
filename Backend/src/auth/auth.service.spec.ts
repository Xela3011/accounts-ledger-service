import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
  let passwordService: jest.Mocked<Pick<PasswordService, 'verify'>>;
  let jwtService: { signAsync: jest.MockedFunction<(payload: object) => Promise<string>> };

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
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    passwordService = {
      verify: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      passwordService as unknown as PasswordService,
      jwtService as unknown as JwtService,
    );
  });

  it('returns a JWT when login credentials are valid', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-jwt');

    await expect(
      service.login({
        email: user.email,
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt',
      user,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('rejects login when credentials are invalid', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({
        email: user.email,
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects JWT payloads for users that no longer exist', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.validateJwtPayload({
        sub: user.id,
        email: user.email,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
