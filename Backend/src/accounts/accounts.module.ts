import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AccountsCacheService } from './accounts-cache.service';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), AuthModule],
  providers: [AccountsRepository, AccountsCacheService, AccountsService, AccountsResolver],
  exports: [TypeOrmModule, AccountsRepository, AccountsCacheService, AccountsService],
})
export class AccountsModule {}
