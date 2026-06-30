import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.getOrThrow<string>('database.host'),
    port: configService.getOrThrow<number>('database.port'),
    username: configService.getOrThrow<string>('database.username'),
    password: configService.getOrThrow<string>('database.password'),
    database: configService.getOrThrow<string>('database.name'),
    autoLoadEntities: true,
    synchronize: configService.getOrThrow<boolean>('database.synchronize'),
    logging: configService.getOrThrow<boolean>('database.logging'),
    migrations: ['dist/src/infrastructure/database/migrations/*.js'],
    migrationsRun: false,
  }),
};
