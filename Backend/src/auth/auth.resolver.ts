import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthPayload } from './models/auth-payload.model';
import { AuthenticatedUser } from './models/authenticated-user.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserEntity)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserEntity> {
    return this.authService.getAuthenticatedUser(user.id);
  }
}
