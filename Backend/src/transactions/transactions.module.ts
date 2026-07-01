import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsRepository } from './repositories/transactions.repository';
import { TransactionsResolver } from './transactions.resolver';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]), AccountsModule, AuthModule],
  providers: [TransactionsRepository, TransactionsService, TransactionsResolver],
  exports: [TypeOrmModule, TransactionsRepository, TransactionsService],
})
export class TransactionsModule {}
