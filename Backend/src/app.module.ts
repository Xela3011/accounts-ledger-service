import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from 'express';
import { join } from 'path';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { validateEnvironment } from './config/validate-environment';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { typeOrmModuleOptions } from './infrastructure/database/typeorm-module.options';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

interface GraphQLContextFactoryArgs {
  req: Request;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig, redisConfig],
      validate: validateEnvironment,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: true,
      context: ({ req }: GraphQLContextFactoryArgs) => ({ req }),
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    LoggingModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
