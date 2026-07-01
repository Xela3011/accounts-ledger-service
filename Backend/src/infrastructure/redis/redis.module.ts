import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisCacheService } from './redis-cache.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.getOrThrow<string>('redis.host'),
          port: configService.getOrThrow<number>('redis.port'),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
    RedisCacheService,
  ],
  exports: [REDIS_CLIENT, RedisCacheService],
})
export class RedisModule {}
