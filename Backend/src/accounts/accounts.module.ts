import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), AuthModule],
  providers: [AccountsRepository, AccountsService, AccountsResolver],
  exports: [TypeOrmModule, AccountsRepository, AccountsService],
})
export class AccountsModule {}
