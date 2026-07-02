import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { WinstonLogger } from './winston.logger';

@Module({
  providers: [WinstonLogger, RequestLoggingMiddleware],
  exports: [WinstonLogger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
