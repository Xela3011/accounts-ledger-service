import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { TransactionInput } from './dto/transaction.input';
import { TransactionHistoryInput } from './dto/transaction-history.input';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

@UseGuards(JwtAuthGuard)
@Resolver(() => TransactionEntity)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Mutation(() => TransactionEntity)
  creditAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: TransactionInput,
  ): Promise<TransactionEntity> {
    return this.transactionsService.credit(user.id, input);
  }

  @Mutation(() => TransactionEntity)
  debitAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: TransactionInput,
  ): Promise<TransactionEntity> {
    return this.transactionsService.debit(user.id, input);
  }

  @Query(() => [TransactionEntity])
  transactions(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input', { nullable: true }) input?: TransactionHistoryInput,
  ): Promise<TransactionEntity[]> {
    return this.transactionsService.history(user.id, input);
  }
}
