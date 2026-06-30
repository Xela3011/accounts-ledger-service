import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './models/auth-payload.model';
import { AuthenticatedUser } from './models/authenticated-user.model';
import { JwtPayload } from './models/jwt-payload.model';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.validateUser(input.email, input.password);
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.usersService.findByEmail(email);
    const isValidPassword = user
      ? await this.passwordService.verify(password, user.passwordHash)
      : false;

    if (!user || !isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async getAuthenticatedUser(id: string): Promise<UserEntity> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return user;
  }
}
