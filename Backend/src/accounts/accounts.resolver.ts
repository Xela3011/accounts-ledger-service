import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountInput } from './dto/create-account.input';
import { AccountEntity } from './entities/account.entity';

@UseGuards(JwtAuthGuard)
@Resolver(() => AccountEntity)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @Mutation(() => AccountEntity)
  createAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateAccountInput,
  ): Promise<AccountEntity> {
    return this.accountsService.create(user.id, input);
  }

  @Mutation(() => AccountEntity)
  freezeAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }, new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AccountEntity> {
    return this.accountsService.freeze(user.id, id);
  }

  @Mutation(() => AccountEntity)
  unfreezeAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }, new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AccountEntity> {
    return this.accountsService.unfreeze(user.id, id);
  }

  @Mutation(() => AccountEntity)
  cancelAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }, new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AccountEntity> {
    return this.accountsService.cancel(user.id, id);
  }

  @Query(() => [AccountEntity])
  accounts(@CurrentUser() user: AuthenticatedUser): Promise<AccountEntity[]> {
    return this.accountsService.list(user.id);
  }

  @Query(() => AccountEntity)
  account(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }, new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AccountEntity> {
    return this.accountsService.getAccount(user.id, id);
  }

  @Query(() => String)
  balance(
    @CurrentUser() user: AuthenticatedUser,
    @Args('accountId', { type: () => ID }, new ParseUUIDPipe({ version: '4' }))
    accountId: string,
  ): Promise<string> {
    return this.accountsService.getBalance(user.id, accountId);
  }
}
