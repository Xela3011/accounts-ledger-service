import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { WinstonLogger } from './winston.logger';

const requestIdHeader = 'x-request-id';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const requestId = this.getRequestId(request);

    response.setHeader(requestIdHeader, requestId);
    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const metadata = {
        context: 'HTTP',
        requestId,
        method: request.method,
        path: request.originalUrl || request.url,
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        contentLength: response.getHeader('content-length'),
        remoteAddress: request.ip,
      };

      if (response.statusCode >= 500) {
        this.logger.error('HTTP request failed', metadata);
        return;
      }

      if (response.statusCode >= 400) {
        this.logger.warn('HTTP request completed with client error', metadata);
        return;
      }

      this.logger.log('HTTP request completed', metadata);
    });

    next();
  }

  private getRequestId(request: Request): string {
    const headerValue = request.header(requestIdHeader);
    return headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();
  }
}
