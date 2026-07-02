import { LoggerService } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';

type LogMetadata = Record<string, unknown>;

const serviceName = 'qik-accounts-ledger-backend';
const defaultLogLevel = process.env.NODE_ENV === 'test' ? 'error' : 'info';

function buildWinstonLogger(): Logger {
  return createLogger({
    level: process.env.LOG_LEVEL ?? defaultLogLevel,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format((info) => {
        info.service = serviceName;
        info.environment = process.env.NODE_ENV ?? 'development';
        return info;
      })(),
      format.json(),
    ),
    transports: [new transports.Console()],
  });
}

export function createWinstonLogger(): WinstonLogger {
  return new WinstonLogger(buildWinstonLogger());
}

export class WinstonLogger implements LoggerService {
  constructor(private readonly logger: Logger = buildWinstonLogger()) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams, true);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  private write(
    level: string,
    message: unknown,
    optionalParams: unknown[],
    firstStringIsTrace = false,
  ): void {
    const metadata = this.extractMetadata(optionalParams, firstStringIsTrace);
    const normalizedMessage = message instanceof Error ? message.message : String(message);

    this.logger.log({
      level,
      message: normalizedMessage,
      ...(message instanceof Error
        ? {
            errorName: message.name,
            stack: message.stack,
          }
        : {}),
      ...metadata,
    });
  }

  private extractMetadata(optionalParams: unknown[], firstStringIsTrace: boolean): LogMetadata {
    const metadata: LogMetadata = {};
    let traceWasAssigned = false;
    let contextWasAssigned = false;

    for (const parameter of optionalParams) {
      if (parameter === undefined || parameter === null) {
        continue;
      }

      if (typeof parameter === 'string') {
        if (firstStringIsTrace && !traceWasAssigned) {
          metadata.trace = parameter;
          traceWasAssigned = true;
          continue;
        }

        if (!contextWasAssigned) {
          metadata.context = parameter;
          contextWasAssigned = true;
          continue;
        }

        metadata.extra = [...this.asArray(metadata.extra), parameter];
        continue;
      }

      if (parameter instanceof Error) {
        metadata.errorName = parameter.name;
        metadata.trace = parameter.stack;
        continue;
      }

      if (typeof parameter === 'object') {
        Object.assign(metadata, parameter);
        continue;
      }

      metadata.extra = [...this.asArray(metadata.extra), parameter];
    }

    return metadata;
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }
}
